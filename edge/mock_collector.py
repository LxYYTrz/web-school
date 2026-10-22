# -*- coding: utf-8 -*-
"""
Mock 边缘采集器
================
模拟一条产线向 MQTT Broker 上报数据,用于现场到位前的全链路开发。
主题与报文格式严格遵守数据契约 docs/contract/README.md ——
到现场后用真实采集器(如 plc_collector.py)替换本文件,云端/前端/数据库零改动。

运行:  python mock_collector.py
配置:  环境变量 MQTT_HOST / MQTT_PORT / MQTT_USERNAME / MQTT_PASSWORD / LINE_ID / ROBOT_ID
"""
import json
import math
import os
import random
import time

import paho.mqtt.client as mqtt

# MQTT Broker 的主机地址。默认本机 —— 工控机上 EMQX/Mosquitto 就在本机
MQTT_HOST = os.getenv("MQTT_HOST", "localhost")
# MQTT Broker 的端口。1883 = 明文；8883 = TLS 加密（生产用）
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
# 认证账号密码。os.getenv 默认 None；`or None` 把空字符串也归一成 None
# （None = 匿名登录，非 None = 用账号密码）
MQTT_USERNAME = os.getenv("MQTT_USERNAME") or None
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD") or None
# 产线编码：必须与数据库 production_lines.code 一致（后端靠它把 code 翻译成主键）
LINE_ID = os.getenv("LINE_ID", "line-01")
# 机器人设备编码：必须与数据库 devices.code 一致
ROBOT_ID = os.getenv("ROBOT_ID", "robot-01")

# 机器人六轴遥测主题（上行，10Hz）
T_ROBOT  = f"tl/v1/{LINE_ID}/telemetry/robot/{ROBOT_ID}"
# 产线状态主题（上行，1Hz，retained）
T_STATUS = f"tl/v1/{LINE_ID}/telemetry/status"
# 生产事件主题（上行，事件触发）
T_EVENT  = f"tl/v1/{LINE_ID}/event"
# 边缘在线状态主题（上行，retained + LWT）
T_EDGE   = f"tl/v1/{LINE_ID}/edge/status"
# ★ 控制指令主题（下行，我们订阅它）。末尾的 + 是 MQTT 单层通配符，
#   意思是"这条产线下所有设备的指令我都收"
T_CMD    = f"tl/v1/{LINE_ID}/cmd/+"
# 指令回执主题（上行）
T_ACK    = f"tl/v1/{LINE_ID}/cmd_ack"

# 模拟节拍：每 8.5 秒出一件（真实节拍由 PLC 决定）
BEAT_SECONDS = 8.5   # 模拟节拍:每 8.5s 出一件
# 机器人关节数据发布频率（Hz）
ROBOT_HZ = 10        # 关节数据发布频率


def now_ms() -> int:
    return int(time.time() * 1000)


def pub(client, topic, obj, qos=0, retain=False):
    # ensure_ascii=False → 中文不转义（否则看到的是 \uXXXX）
    client.publish(topic, json.dumps(obj, ensure_ascii=False), qos=qos, retain=retain)


def on_message(client, userdata, msg):
    """控制指令 mock:收到指令 0.3s 后回 ack(模拟 PLC 已执行)。
    真实采集器中,这里替换为"写 PLC 寄存器 → 等待 PLC 反馈"。"""
    try:
        # 解析指令 JSON
        cmd = json.loads(msg.payload.decode("utf-8"))
        # 打印收到的指令（联调时肉眼可见）
        print(f"[cmd] 收到指令 type={cmd.get('type')} topic={msg.topic}")
        # 模拟 PLC 执行耗时（真实场景是等 PLC 写完寄存器再反馈）
        time.sleep(0.3)
        # 回执：cmdId 必须原样带回，后端靠它更新 control_commands 的状态
        pub(client, T_ACK, {
            "ts": now_ms(),
            "cmdId": cmd.get("cmdId"),
            "status": "acked",
            "message": "mock 已执行",
        }, qos=1)
    except Exception as exc:  # mock 阶段宽容处理,不让异常打断主循环
        # 真实采集器里这里应该：记录日志 + 回 failed 回执
        print(f"[cmd] 处理失败: {exc}")


def main():
    # ---- 1. 创建 MQTT 客户端 ----
    # CallbackAPIVersion.VERSION2 = paho 2.x 的回调签名规范
    # client_id 必须唯一（同一时刻两个客户端用同一个 ID，Broker 会踢掉前一个）
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2,
                         client_id=f"edge-mock-{LINE_ID}")
    # ---- 2. 配置认证 ----
    if MQTT_USERNAME:
        client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    # LWT:异常掉线时 Broker 自动发布 retained offline —— 产线离线状态由此而来
    # ---- 3. 设置遗嘱消息（LWT）----
    # LWT:异常掉线时 Broker 自动发布 retained offline —— 产线离线状态由此而来
    # 原理：我们告诉 Broker"如果我异常消失了，帮我发这条消息"。
    #       Broker 会在客户端**非正常断开**时（心跳超时/网络断开）自动发布。
    #       正常关闭连接时（client.disconnect()）不会发遗嘱 —— 所以正常下线
    #       时我们要自己发一条 offline（见 main 函数末尾的说明）。
    client.will_set(
        T_EDGE,
        json.dumps({"ts": now_ms(), "lineId": LINE_ID, "status": "offline"}),
        qos=1, retain=True,
    )
    # ---- 4. 注册消息回调 ----
    # 收到下行指令时会调用 on_message
    client.on_message = on_message
    # ---- 5. 建立连接 ----
    # connect 是阻塞的（会做 TCP 连接 + MQTT CONNECT/SUBACK 握手）
    client.connect(MQTT_HOST, MQTT_PORT, keepalive=30)
    # ---- 6. 订阅下行指令主题 ----
    # QoS1：指令不能丢
    client.subscribe(T_CMD, qos=1)
    # ---- 7. 启动网络线程 ----
    # paho 的收发循环跑在后台线程里。不调用 loop_start() 就没有网络收发能力。
    client.loop_start()

    # ---- 8. 发布"边缘在线"（retained）----
    # 因为是 retained，后端**任何时候**订阅都能立刻拿到这条 online。
    # 这就实现了"后端晚启动也能立刻知道边缘在线"。
    pub(client, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "online"},
        qos=1, retain=True)
    # ---- 9. 发布一条"产线启动"事件（让页面的事件流一开始就有内容）----
    pub(client, T_EVENT, {"ts": now_ms(), "lineId": LINE_ID, "deviceId": "plc-01",
                          "type": "start", "level": "info",
                          "message": "产线启动(mock)"}, qos=1)

    # 六轴仿真参数:基值 + 幅值 * sin,各轴频率不同,运动看起来更自然
    # ---- 10. 六轴仿真参数 ----
    # 每个关节用「基值 + 幅值 * sin(2π * 频率 * t)」生成。
    # 各轴频率不同 → 运动看起来更自然（真实机械臂各关节节奏本来就不同）。
    base = [0.0, -30.0, 45.0, 0.0, 60.0, 0.0]
    amp  = [60.0, 20.0, 25.0, 45.0, 30.0, 90.0]
    freq = [0.10, 0.13, 0.11, 0.07, 0.09, 0.15]

    # ---- 11. 循环状态变量 ----
    t0 = time.time()
    last_status = 0.0
    last_beat = -1
    seq = 0
    next_alarm = t0 + random.uniform(90, 180)

    # 启动提示
    print(f"mock collector 已启动  broker={MQTT_HOST}:{MQTT_PORT}  line={LINE_ID}")
    try:
        # ---- 12. 主循环：按 ROBOT_HZ 频率发布数据 ----
        while True:
            t = time.time() - t0
            now = time.time()

            # 1) 机器人六轴遥测 @10Hz
            # ========== ① 机器人六轴遥测 @10Hz ==========
            # 用 zip 同时遍历 base/amp/freq，生成 6 个关节角
            joints = [round(b + a * math.sin(2 * math.pi * f * t), 3)
                      for b, a, f in zip(base, amp, freq)]
            pub(client, T_ROBOT, {
                "ts": now_ms(), "deviceId": ROBOT_ID,
                "joints": joints,
                "tcp": None,  # mock 不做运动学正解;现场若 PLC 提供则填实际值
                "speedPct": 80, "mode": "auto",
                "program": "MOCK_CYCLE", "alarmCode": 0,
            }, qos=0)

            # 2) 产线状态快照 @1Hz(retained)
            # ========== ② 产线状态快照 @1Hz(retained) ==========
            # beat_index = 已经过了多少个节拍周期（整数）
            beat_index = int(t // BEAT_SECONDS)
            # 每秒最多发一次
            if now - last_status >= 1.0:
                last_status = now
                ng = beat_index // 50  # 每 50 件出 1 件 NG
                pub(client, T_STATUS, {
                    "ts": now_ms(), "lineId": LINE_ID, "state": "running",
                    "productCode": "MOCK-P1",
                    "goodCount": beat_index - ng, "ngCount": ng,
                    "beatMs": int(BEAT_SECONDS * 1000),
                }, qos=1, retain=True)

            # 3) 每件一次:piece_done 事件
            # ========== ③ 每件一次:单件完成事件 ==========
            # 节拍序号变了 → 说明又出了一件
            if beat_index != last_beat and t >= 1:
                last_beat = beat_index
                seq += 1
                # 工件序列号：SN + 日期 + 5 位序号
                sn = f"SN{time.strftime('%Y%m%d')}{seq:05d}"
                pub(client, T_EVENT, {
                    "ts": now_ms(), "lineId": LINE_ID, "deviceId": ROBOT_ID,
                    "type": "piece_done", "level": "info",
                    "message": f"工件 {sn} 完成",
                }, qos=1)

            # 4) 偶发告警(90~180s 随机)
            # ========== ④ 偶发告警(90~180s 随机) ==========
            if now >= next_alarm:
                # 排下一次报警时间
                next_alarm = now + random.uniform(90, 180)
                pub(client, T_EVENT, {
                    "ts": now_ms(), "lineId": LINE_ID, "deviceId": "plc-01",
                    "type": "alarm", "level": "warning",
                    "code": "W201", "message": "气源压力偏低(mock)",
                }, qos=1)

            # ========== ⑤ 控制循环节奏 ==========
            # sleep(1/ROBOT_HZ) = 0.1 秒 → 每秒 10 次循环 → 10Hz
            time.sleep(1.0 / ROBOT_HZ)
    except KeyboardInterrupt:
        # Ctrl+C 退出
        print("停止 mock collector")


# ---------------------------------------------------------------------------
# 六、程序入口
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # 只有直接运行本文件时才执行 main()（被 import 时不执行）
    main()
