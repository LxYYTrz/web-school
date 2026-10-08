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

MQTT_HOST = os.getenv("MQTT_HOST", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_USERNAME = os.getenv("MQTT_USERNAME") or None
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD") or None
LINE_ID = os.getenv("LINE_ID", "line-01")
ROBOT_ID = os.getenv("ROBOT_ID", "robot-01")

T_ROBOT  = f"tl/v1/{LINE_ID}/telemetry/robot/{ROBOT_ID}"
T_STATUS = f"tl/v1/{LINE_ID}/telemetry/status"
T_EVENT  = f"tl/v1/{LINE_ID}/event"
T_VISION = f"tl/v1/{LINE_ID}/vision/result"
T_EDGE   = f"tl/v1/{LINE_ID}/edge/status"
T_CMD    = f"tl/v1/{LINE_ID}/cmd/+"
T_ACK    = f"tl/v1/{LINE_ID}/cmd_ack"

BEAT_SECONDS = 8.5   # 模拟节拍:每 8.5s 出一件
ROBOT_HZ = 10        # 关节数据发布频率


def now_ms() -> int:
    return int(time.time() * 1000)


def pub(client, topic, obj, qos=0, retain=False):
    client.publish(topic, json.dumps(obj, ensure_ascii=False), qos=qos, retain=retain)


def on_message(client, userdata, msg):
    """控制指令 mock:收到指令 0.3s 后回 ack(模拟 PLC 已执行)。
    真实采集器中,这里替换为"写 PLC 寄存器 → 等待 PLC 反馈"。"""
    try:
        cmd = json.loads(msg.payload.decode("utf-8"))
        print(f"[cmd] 收到指令 type={cmd.get('type')} topic={msg.topic}")
        time.sleep(0.3)
        pub(client, T_ACK, {
            "ts": now_ms(),
            "cmdId": cmd.get("cmdId"),
            "status": "acked",
            "message": "mock 已执行",
        }, qos=1)
    except Exception as exc:  # mock 阶段宽容处理,不让异常打断主循环
        print(f"[cmd] 处理失败: {exc}")


def main():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2,
                         client_id=f"edge-mock-{LINE_ID}")
    if MQTT_USERNAME:
        client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    # LWT:异常掉线时 Broker 自动发布 retained offline —— 产线离线状态由此而来
    client.will_set(
        T_EDGE,
        json.dumps({"ts": now_ms(), "lineId": LINE_ID, "status": "offline"}),
        qos=1, retain=True,
    )
    client.on_message = on_message
    client.connect(MQTT_HOST, MQTT_PORT, keepalive=30)
    client.subscribe(T_CMD, qos=1)
    client.loop_start()

    pub(client, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "online"},
        qos=1, retain=True)
    pub(client, T_EVENT, {"ts": now_ms(), "lineId": LINE_ID, "deviceId": "plc-01",
                          "type": "start", "level": "info",
                          "message": "产线启动(mock)"}, qos=1)

    # 六轴仿真参数:基值 + 幅值 * sin,各轴频率不同,运动看起来更自然
    base = [0.0, -30.0, 45.0, 0.0, 60.0, 0.0]
    amp  = [60.0, 20.0, 25.0, 45.0, 30.0, 90.0]
    freq = [0.10, 0.13, 0.11, 0.07, 0.09, 0.15]

    t0 = time.time()
    last_status = 0.0
    last_beat = -1
    seq = 0
    next_alarm = t0 + random.uniform(90, 180)

    print(f"mock collector 已启动  broker={MQTT_HOST}:{MQTT_PORT}  line={LINE_ID}")
    try:
        while True:
            t = time.time() - t0
            now = time.time()

            # 1) 机器人六轴遥测 @10Hz
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
            beat_index = int(t // BEAT_SECONDS)
            if now - last_status >= 1.0:
                last_status = now
                ng = beat_index // 50  # 每 50 件出 1 件 NG
                pub(client, T_STATUS, {
                    "ts": now_ms(), "lineId": LINE_ID, "state": "running",
                    "productCode": "MOCK-P1",
                    "goodCount": beat_index - ng, "ngCount": ng,
                    "beatMs": int(BEAT_SECONDS * 1000),
                }, qos=1, retain=True)

            # 3) 每件一次:视觉结果 + piece_done 事件
            if beat_index != last_beat and t >= 1:
                last_beat = beat_index
                seq += 1
                sn = f"SN{time.strftime('%Y%m%d')}{seq:05d}"
                is_ng = (seq % 50 == 0)
                defects = ([{
                    "type": "scratch",
                    "x": random.randint(0, 600), "y": random.randint(0, 400),
                    "w": random.randint(10, 60), "h": random.randint(5, 30),
                }] if is_ng else [])
                pub(client, T_VISION, {
                    "ts": now_ms(), "lineId": LINE_ID, "cameraId": "cam-01",
                    "sn": sn, "result": "ng" if is_ng else "ok",
                    "defects": defects,
                    "imageUrl": None, "thumbUrl": None,  # 图片链路接通后由后端补全
                }, qos=1)
                pub(client, T_EVENT, {
                    "ts": now_ms(), "lineId": LINE_ID, "deviceId": ROBOT_ID,
                    "type": "piece_done", "level": "info",
                    "message": f"工件 {sn} 完成",
                }, qos=1)

            # 4) 偶发告警(90~180s 随机)
            if now >= next_alarm:
                next_alarm = now + random.uniform(90, 180)
                pub(client, T_EVENT, {
                    "ts": now_ms(), "lineId": LINE_ID, "deviceId": "plc-01",
                    "type": "alarm", "level": "warning",
                    "code": "W201", "message": "气源压力偏低(mock)",
                }, qos=1)

            time.sleep(1.0 / ROBOT_HZ)
    except KeyboardInterrupt:
        print("停止 mock collector")


if __name__ == "__main__":
    main()
