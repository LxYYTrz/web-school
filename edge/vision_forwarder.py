#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
视觉机 → 工控机 图片转发器
============================
监视一个文件夹,发现新的检测图片就 POST 到工控机的 /api/vision/images。

设计取向:视觉机内存很小、可能没外网,所以
  - **零依赖**:只用 Python 标准库(urllib 手动拼 multipart),
    不用 requests —— 省掉"视觉机上 pip install 装不上"的故障点
  - 轮询式监视(不用 inotify/watchdog),内存占用可忽略
  - 上传时按 64KB 分块读文件,不把整张图读进内存

用法(先改 parse_filename,见文件末尾的"⚠️ 需要对齐"一节):
    python vision_forwarder.py --watch-dir "D:\\Vision\\shots" ^
        --token <从工控机 server\\.env 的 VISION_TOKEN 取> ^
        --endpoint http://192.168.10.192:3000/api/vision/images ^
        --camera cam-01

参数也可用环境变量:
    VISION_WATCH_DIR / VISION_TOKEN / VISION_ENDPOINT / VISION_CAMERA
    VISION_POLL_SECONDS(默认 2)/ VISION_EXTENSIONS(默认 .jpg,.jpeg,.png,.bmp,.tif,.tiff)
    VISION_MOVE_TO(上传成功后把原图移到哪,默认不移动)/ VISION_DELETE_AFTER(1=删原图)
"""
import argparse
import datetime
import hashlib
import http.client
import json
import logging
import os
import re
import sys
import time
import urllib.parse
import uuid
from pathlib import Path

LOG = logging.getLogger("vision-forwarder")

STATE_FILE = ".vision_forwarder_state.json"   # 记录已传过的文件,避免重复上传
DEFAULT_EXTENSIONS = (".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff")


# ============================================================================
# ⚠️ 需要对齐:文件名 → (sn, result, capturedAt)
# ----------------------------------------------------------------------------
# 现场的真实文件名规则还没最终确认。这里先按一个常见写法实现,
# 拿到真实文件名样例后,只改这一个函数就行,其余逻辑不用动。
#
# 约束(后端会校验,不合规直接 400):
#   - sn 只允许 字母 数字 . _ -  (不能有空格 / 斜杠 / 中文)
#   - sn 长度 <= 128
#   - result 只能是 ok 或 ng
#   - capturedAt 是 epoch 毫秒;返回 None 表示让服务端用接收时间
# ============================================================================
def parse_filename(path: Path):
    """返回 (sn, result, captured_at_ms) 或 None(表示这个文件跳过不上传)。"""
    stem = path.stem                     # 去掉扩展名
    result = "ng" if re.search(r"(^|[_\-])(NG|ng)([_\-]|$)", stem) else "ok"

    # 从文件名里抠出 sn:优先"SN"后面那段,否则整个 stem
    m = re.search(r"SN[_\-]?([A-Za-z0-9._-]+)", stem, re.IGNORECASE)
    sn = m.group(1) if m else stem

    # 抠时间戳:14 位数字(yyyyMMddHHmmss)或 13 位 epoch 毫秒
    ts = None
    d = re.search(r"(\d{14})", stem)
    if d:
        import datetime
        try:
            ts = int(datetime.datetime.strptime(d.group(1), "%Y%m%d%H%M%S").timestamp() * 1000)
        except ValueError:
            ts = None
    if ts is None:
        e = re.search(r"(\d{13})", stem)
        if e:
            ts = int(e.group(1))

    if not sn or not re.fullmatch(r"[A-Za-z0-9._-]+", sn) or len(sn) > 128:
        LOG.warning("文件名解析不出合法 sn,跳过: %s", path.name)
        return None
    return sn, result, ts


# ============================================================================
# 状态:已传过的文件(按 内容哈希 + 大小 + mtime,避免同名覆盖漏传)
# ============================================================================
def load_state(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_state(path: Path, state: dict):
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(state, ensure_ascii=False), encoding="utf-8")
    tmp.replace(path)          # 原子替换,断电也不会写坏


def file_key(p: Path) -> str:
    st = p.stat()
    raw = f"{p.name}|{st.st_size}|{int(st.st_mtime)}"
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:16]


def is_stable(p: Path, checks: int = 2) -> bool:
    """文件大小连续两次不变才认为写完了 —— 相机可能正在往里写。"""
    last = -1
    for _ in range(checks):
        try:
            size = p.stat().st_size
        except OSError:
            return False
        if size == last and size > 0:
            return True
        last = size
        time.sleep(0.3)
    return False


# ============================================================================
# 上传(纯标准库 multipart)
# ============================================================================
CHUNK = 64 * 1024
CRLF = b"\r\n"
_CT = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
       ".bmp": "image/bmp", ".tif": "image/tiff", ".tiff": "image/tiff"}


def upload(path: Path, endpoint: str, token: str, camera: str, sn: str, result: str, ts):
    """POST 一个 multipart/form-data。

    用 http.client 而不是 urllib.request:后者只能一次给全量 data,
    无法"前言 + 文件流 + 结尾"分块发送(Content-Length 会对不上导致截断)。
    http.client 支持 putrequest/putheader/send 分步发送,内存占用恒定。
    """
    u = urllib.parse.urlsplit(endpoint)
    secure = u.scheme == "https"
    host = u.hostname or ""
    port = u.port or (443 if secure else 80)
    target = u.path or "/"
    if u.query:
        target += "?" + u.query

    boundary = "----ltvision" + uuid.uuid4().hex
    file_size = path.stat().st_size
    ctype = _CT.get(path.suffix.lower(), "application/octet-stream")
    NL = "\r\n"

    fields = [("sn", sn), ("result", result), ("cameraId", camera)]
    if ts:
        fields.append(("capturedAt", str(ts)))

    pre = bytearray()
    for name, value in fields:
        pre += (f"--{boundary}{NL}"
                f'Content-Disposition: form-data; name="{name}"{NL}{NL}'
                f"{value}{NL}").encode("utf-8")
    pre += (f"--{boundary}{NL}"
            f'Content-Disposition: form-data; name="file"; filename="{path.name}"{NL}'
            f"Content-Type: {ctype}{NL}{NL}").encode("utf-8")
    post = f"{NL}--{boundary}--{NL}".encode("utf-8")

    conn = (http.client.HTTPSConnection(host, port, timeout=120) if secure
            else http.client.HTTPConnection(host, port, timeout=120))
    try:
        conn.putrequest("POST", target, skip_accept_encoding=True)
        conn.putheader("Content-Type", f"multipart/form-data; boundary={boundary}")
        conn.putheader("Content-Length", str(len(pre) + file_size + len(post)))
        conn.putheader("X-Vision-Token", token)
        conn.putheader("Accept", "application/json")
        conn.putheader("Connection", "close")
        conn.endheaders()

        conn.send(bytes(pre))
        with path.open("rb") as f:
            while True:
                chunk = f.read(CHUNK)
                if not chunk:
                    break
                conn.send(chunk)
        conn.send(post)

        resp = conn.getresponse()
        body = resp.read().decode("utf-8", "replace")
        if resp.status >= 400:
            raise RuntimeError(f"HTTP {resp.status}: {body[:200]}")
        return json.loads(body) if body else {}
    except (OSError, http.client.HTTPException) as e:
        raise RuntimeError(f"上传失败 {endpoint}: {e}") from None
    finally:
        conn.close()


def main():
    ap = argparse.ArgumentParser(description="视觉机图片转发器")
    ap.add_argument("--watch-dir", default=os.getenv("VISION_WATCH_DIR"))
    ap.add_argument("--endpoint", default=os.getenv(
        "VISION_ENDPOINT", "http://192.168.10.192:3000/api/vision/images"))
    ap.add_argument("--token", default=os.getenv("VISION_TOKEN", ""))
    ap.add_argument("--camera", default=os.getenv("VISION_CAMERA", "cam-01"))
    ap.add_argument("--poll-seconds", type=float,
                    default=float(os.getenv("VISION_POLL_SECONDS", "2")))
    ap.add_argument("--move-to", default=os.getenv("VISION_MOVE_TO", ""),
                    help="上传成功后把原图移到该目录(不填则原地不动)")
    ap.add_argument("--delete-after", action="store_true",
                    default=os.getenv("VISION_DELETE_AFTER") == "1",
                    help="上传成功后删掉原图(慎用:删了就传不回去了)")
    args = ap.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    if not args.watch_dir:
        ap.error("必须指定 --watch-dir(或设 VISION_WATCH_DIR 环境变量)")
    if not args.token:
        ap.error("必须指定 --token(或设 VISION_TOKEN 环境变量)"
                 "—— 值从工控机 server\\.env 的 VISION_TOKEN 取")

    watch = Path(args.watch_dir)
    if not watch.is_dir():
        ap.error(f"监视目录不存在: {watch}")
    watch.mkdir(parents=True, exist_ok=True)

    exts = tuple(e.strip().lower() for e in
                 os.getenv("VISION_EXTENSIONS", ",".join(DEFAULT_EXTENSIONS)).split(","))

    state_path = watch / STATE_FILE
    state = load_state(state_path)
    LOG.info("监视目录 %s", watch)
    LOG.info("接口 %s", args.endpoint)
    LOG.info("已有 %d 条去重记录", len(state))
    LOG.info("就绪。Ctrl+C 停止。")

    failures = {}          # key -> (下次重试时间戳, 次数)

    try:
        while True:
            try:
                entries = [p for p in watch.iterdir()
                           if p.is_file() and p.suffix.lower() in exts]
            except OSError as e:
                LOG.error("读目录失败: %s", e)
                time.sleep(args.poll_seconds)
                continue

            for p in entries:
                key = file_key(p)
                if key in state:
                    continue
                if key in failures and failures[key][0] > time.time():
                    continue
                if not is_stable(p):
                    continue

                parsed = parse_filename(p)
                if parsed is None:
                    state[key] = "skip"
                    save_state(state_path, state)
                    continue
                sn, result, ts = parsed

                try:
                    info = upload(p, args.endpoint, args.token, args.camera, sn, result, ts)
                    LOG.info("已传 sn=%s result=%s id=%s (%s)",
                             sn, result, info.get("id"), p.name)
                    state[key] = "ok"
                    failures.pop(key, None)

                    if args.delete_after:
                        p.unlink(missing_ok=True)
                    elif args.move_to:
                        dest = Path(args.move_to)
                        dest.mkdir(parents=True, exist_ok=True)
                        p.replace(dest / p.name)
                except Exception as exc:
                    n = failures.get(key, (0, 0))[1] + 1
                    # 退避重试:10s / 20s / 40s ... 最多 5min
                    delay = min(300, 10 * (2 ** (n - 1)))
                    failures[key] = (time.time() + delay, n)
                    LOG.error("上传失败(%s,第%d次,%.0fs 后重试): %s",
                              p.name, n, delay, exc)

            if len(state) > 20000:      # 去重表别无限涨
                state = dict(list(state.items())[-10000:])
            save_state(state_path, state)
            time.sleep(args.poll_seconds)

    except KeyboardInterrupt:
        LOG.info("停止")
    finally:
        save_state(state_path, state)


if __name__ == "__main__":
    main()
