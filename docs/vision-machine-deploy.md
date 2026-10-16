# 视觉工控机部署指南(图片转发器)

> 面向**视觉工控机**的操作手册。照着做即可,不需要改代码。
> 配套脚本:`edge/vision_forwarder.py`(从本仓库拷过去)
> 对端已部署完毕:**PLC 工控机 `192.168.10.192:3000`** 已就绪,已验证可接收。

---

## 0. 一句话说清原理

```
视觉相机 → 存图到某个文件夹
                    │
                    ▼
   vision_forwarder.py 监视这个文件夹(轮询,内存占用极小)
                    │  HTTP POST multipart,Header 带 X-Vision-Token
                    ▼
   PLC 工控机 192.168.10.192:3000
     ├─ 校验共享密钥(不对直接 401)
     ├─ 原图落盘 D:\line-twin\data\vision\{日期}\{sn}.jpg
     ├─ 生成缩略图(长边 640)
     ├─ 写数据库 vision_images 表
     └─ WebSocket 推给前端 → 网站「视觉检测」页实时出图
```

视觉机这边**只做一件事**:盯着文件夹,把新图 POST 出去。

---

## 1. 前置确认(装机前先核对)

| 检查项 | 期望值 | 怎么查 |
|---|---|---|
| 视觉机与工控机同网段 | 能 ping 通 `192.168.10.192` | `ping 192.168.10.192` |
| 工控机 3000 端口可达 | TCP 通 | 见 §5 故障排查的 ping/端口命令 |
| Python 版本 | **3.9 或更高** | `python --version` |
| 相机存图目录 | 你知道路径 | 自己确认,后续要填 |
| **共享密钥** | 从工控机取 | 见下面 §1.1 |

### 1.1 取共享密钥(必做,视觉机要配同一个值)

在 **PLC 工控机**上执行:

```powershell
Get-Content D:\line-twin\server\.env | Select-String VISION_TOKEN
```

输出形如 `VISION_TOKEN=xxxxxxxx`。**只取等号后面那串**,填到视觉机的参数里。

> ⚠️ 这个值等同于上传接口的密码。**不要贴到聊天/截图/群里**,只写在视觉机本地。
> 泄露了就在工控机上改 `server\.env` 的 `VISION_TOKEN` 并重启后端。

---

## 2. 拷贝脚本

把仓库里的 **`edge/vision_forwarder.py`** 拷到视觉机,建议放在:

```
D:\line-twin-vision\vision_forwarder.py
```

### 2.1 ⚠️ 必须先改一处:`parse_filename`

脚本要靠**文件名**认出「哪张图属于哪个工件」。**现场真实文件名规则还没最终确认**,
所以脚本里现在是通用猜测。**拿到真实文件名样例后,只改 `parse_filename()` 这一个函数。**

当前规则:

| 文件名长这样 | 解析成 |
|---|---|
| `SN20261016000001.jpg` | sn=`20261016000001`, result=ok, 时间从文件名取 |
| `SN20261016000002_NG.jpg` | sn=`20261016000002_NG`, result=**ng** |
| `20261016_123456.jpg` | sn=`20261016_123456`, result=ok, 时间取不到 |
| 名字里有空格/中文/斜杠 | **跳过不上传**,日志里会写一行警告 |

sn 的硬约束(**后端会校验,不合规直接 400 拒绝**):
只允许**字母、数字、`.`、`_`、`-`**,长度 ≤ 128。

改动示例 —— 如果真实文件名是 `产品号_序号_判定.jpg`:

```python
def parse_filename(path: Path):
    stem = path.stem
    parts = stem.split("_")
    if len(parts) < 2:
        return None
    sn = parts[0] + parts[1]          # 按实际规则拼
    result = "ng" if parts[-1].upper() == "NG" else "ok"
    return sn, result, None            # 第三个是 epoch 毫秒,取不到就 None
```

改完先按 §4 验证,确认日志里 `已传 sn=...` 打出来是对的,再长期跑。

---

## 3. 运行

### 3.1 先手动跑一次(前台,看输出)

```bat
cd /d D:\line-twin-vision
python vision_forwarder.py ^
  --watch-dir "D:\Vision\shots" ^
  --endpoint http://192.168.10.192:3000/api/vision/images ^
  --token <§1.1 取到的值> ^
  --camera cam-01 ^
  --poll-seconds 2
```

正常输出长这样:

```
2026-10-16 14:32:08 INFO [vision-forwarder] 监视目录 D:\Vision\shots
2026-10-16 14:32:08 INFO [vision-forwarder] 接口 http://192.168.10.192:3000/api/vision/images
2026-10-16 14:32:08 INFO [vision-forwarder] 已有 0 条去重记录
2026-10-16 14:32:08 INFO [vision-forwarder] 就绪。Ctrl+C 停止。
2026-10-16 14:32:08 INFO [vision-forwarder] 已传 sn=20261016000001 result=ok id=1768 (SN20261016000001.jpg)
```

`已传 ... id=NNNN` 就是成功了 —— 打开网站「视觉检测」页应该能看到图。

### 3.2 长期跑(后台)

建议做成 Windows 计划任务(NSSM 也行),**开机自启**:

```bat
pythonw.exe D:\line-twin-vision\vision_forwarder.py ^
  --watch-dir "D:\Vision\shots" ^
  --endpoint http://192.168.10.192:3000/api/vision/images ^
  --token <同上的值> ^
  --camera cam-01 ^
  --move-to "D:\Vision\sent"
```

用 `pythonw.exe`(在 Python 安装目录下)不弹黑窗。
`--move-to` 会把传成功的原图移到 `sent` 子目录 —— **原图不会被删**,只是挪位置,方便留档。

### 3.3 参数说明

| 参数 | 默认 | 说明 |
|---|---|---|
| `--watch-dir` | 必填 | 要监视的图片目录 |
| `--endpoint` | `http://192.168.10.192:3000/api/vision/images` | 工控机上传地址 |
| `--token` | 必填 | 共享密钥,见 §1.1 |
| `--camera` | `cam-01` | 相机编码,须与工控机 `devices.code` 一致 |
| `--poll-seconds` | `2` | 轮询间隔秒数 |
| `--move-to` | 空 | 传成功后把原图移到哪 |
| `--delete-after` | 关 | **传成功后删除原图**。慎用,删了传不回来 |

也支持环境变量:`VISION_WATCH_DIR` / `VISION_TOKEN` / `VISION_ENDPOINT` /
`VISION_CAMERA` / `VISION_POLL_SECONDS` / `VISION_MOVE_TO` / `VISION_DELETE_AFTER` /
`VISION_EXTENSIONS`。

---

## 4. 验证清单

逐项过,全过再算部署完成:

| # | 检查 | 期望 | 怎么确认 |
|---|---|---|---|
| 1 | 网络通 | `ping 192.168.10.192` 有回包 | cmd |
| 2 | 端口通 | 端口测试成功 | `powershell -c "Test-NetConnection 192.168.10.192 -Port 3000"` 看 `TcpTestSucceeded = True` |
| 3 | 密钥对 | 上传返回 `id=NNNN` | 看日志有没有 `已传` |
| 4 | 传到了 | 工控机 `D:\line-twin\data\vision\` 下出现新日期目录 | 在工控机上 `dir D:\line-twin\data\vision /s` |
| 5 | 网站能看到 | 「视觉检测」页出现图片格子 | 浏览器打开网站登录后切到该页 |
| 6 | 不重复传 | 同一张图不会反复传 | 脚本有去重记录 `.vision_forwarder_state.json` |

**空跑测试**(不接相机也能验):往监视目录里丢几张现有的图,启动脚本,看日志。

---

## 5. 故障排查

| 现象 | 原因 | 处理 |
|---|---|---|
| `连接失败 ... Connection refused` | 工控机后端没起 / IP 不对 | 确认地址;工控机上 `netstat -ano \| findstr 3000` |
| `上传失败 ... 401` | 共享密钥不对 | 重取 §1.1 的值,注意别带空格 |
| `上传失败 ... 400` 且日志提示 sn 非法 | 文件名解析出的 sn 不合规 | 改 `parse_filename`,见 §2.1 |
| `上传失败 ... 413` | 超过工控机的 100MB 硬顶 | 正常图片不会到这步;真到说明相机配置有问题 |
| `文件名解析不出合法 sn,跳过` | 文件名含空格/中文/斜杠 | 同上,改解析规则 |
| 日志里一直不传,也没报错 | 目录路径写错,或相机不在这个目录 | `dir` 确认 |
| 图传到工控机了但网站看不到 | 前端要刷新/图片已过保留期 | 原图保留 **24 小时**,超时会自动清理 |

### 应急:确认是不是工控机那边的问题

在**视觉机**上直接打接口,绕开脚本:

```bat
curl -X POST http://192.168.10.192:3000/api/vision/images ^
  -H "X-Vision-Token: <你的密钥>" ^
  -F "file=@D:\Vision\shots\测试图.jpg" ^
  -F "sn=TEST001" -F "result=ok"
```

- 返回 `{"ok":true,"id":...}` → 工控机没问题,是脚本/解析的事
- 返回 401 → 密钥不对
- 连不上 → 网络或工控机后端的问题

---

## 6. 几个要注意的点

1. **去重是按「文件名+大小+修改时间」的哈希**。同一张图不会被重复传。
   但如果你**重命名**或**修改**了已传过的图,它会被当成新图再传一次(后端按 sn 更新,不会产生重复行)。

2. **原图保留 24 小时**,工控机每天自动清理一次。视觉机上的原图**不受影响** ——
   建议配 `--move-to` 留档,否则相机目录会越积越多。

3. **视觉机内存很小是设计前提**:脚本零第三方依赖(纯标准库)、
   轮询而非 inotify、每次只处理一张图、上传时按 64KB 分块读文件不整体进内存。

4. **视觉机不需要装任何 pip 包**,也不需要装 Docker。只要有 Python 3.9+ 就能跑。

5. **不要在视觉机上装 nginx / 数据库 / MQTT**,那些都在工控机那边。

6. **不要让视觉机发 MQTT 的 `vision/result`**。图片走 HTTP 就够了,
   同时发 MQTT 会导致数据库里出现重复记录。

---

## 7. 出问题找谁

| 环节 | 找谁查 |
|---|---|
| 相机有没有出图 | 视觉机本地,`dir` 看监视目录 |
| 脚本有没有正确解析 | 视觉机本地,看日志的 `已传 sn=...` |
| 工控机后端收没收到 | 工控机 `server\server.log.err` |
| 图存哪了 | 工控机 `D:\line-twin\data\vision\` |
| 数据库记录 | 工控机 psql 查 `select * from vision_images order by id desc limit 10;` |
| 网站显示 | 浏览器 F12 看 `io_state` / `vision_result` 推送 |

---

## 附:对应的工控机侧配置(供排查时对照)

在 **PLC 工控机** `D:\line-twin\server\.env`:

```
VISION_TOKEN=<§1.1 那个值>
VISION_STORAGE_DIR=D:/line-twin/data/vision
VISION_RETENTION_HOURS=24          # 原图保留 24 小时
VISION_THUMB_MAX_EDGE=640          # 缩略图长边
VISION_DEFAULT_LINE_ID=line-01
VISION_DEFAULT_CAMERA_ID=cam-01
VISION_MAX_UPLOAD_BYTES=104857600  # 100MB 内存保护硬顶,不是业务限制
```

相机编码 `cam-01` 必须存在于工控机数据库 `devices` 表里(当前已有:
`plc-01` / `robot-01` / `cam-01` / `ipc-vision`)。视觉机传的 `cameraId`
解析不到时,记录仍会入库,只是 `camera_id` 为 NULL。
