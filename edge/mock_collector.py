# -*- coding: utf-8 -*-
"""
===============================================================================
文件作用：Mock 边缘采集器（模拟一条产线向 MQTT Broker 上报数据）
所属模块：edge/
===============================================================================

===============================================================================
★ 本文件是整个数据链路的「起点」，是理解全系统的另一个关键入口 ★
===============================================================================

【一、它在物理架构中的位置】

    ┌──────────────┐
    │ 机器人 / PLC │  ← 真实设备（现场）
    └──────┬───────┘
           │ Modbus TCP / OPC UA / S7（现场协议，未实现）
           ▼
    ┌────────────────────────────────────────────────────────┐
    │ ★ 本文件 mock_collector.py ★                          │
    │   现在：正弦函数模拟六轴数据                           │
    │   现场：换成 plc_collector.py，读真实寄存器              │
    │   ★ 云端 / 前端 / 数据库 零改动 ★                      │
    └──────────────────────┬─────────────────────────────────┘
                           │ MQTT publish（TCP 1883 明文 / 8883 TLS）
                           │ 主题：tl/v1/{lineId}/...
                           ▼
                   EMQX Broker（工控机本机）
                           │
                           ▼
                   NestJS 后端（ingest 模块订阅）

【二、为什么叫"Mock"（模拟）】

    现场 PLC 的协议、点位、寄存器地址还没确定（要等电气工程师给点表），
    但整条链路（采集→MQTT→后端→数据库→WebSocket→前端）必须先跑通。
    所以本文件用数学函数"伪造"出符合数据契约的报文，
    让整条链路可以并行开发、并行联调。

    现场切换时，只需要把本文件替换为真实采集器
    （读 PLC 寄存器 → 组装成同样的 JSON → publish 到同样的主题），
    **数据契约（docs/contract/README.md）不变**，其余代码一行都不用动。
    这就是"契约先行"设计的价值。

【三、本文件模拟了哪些 MQTT 主题】

    tl/v1/{lineId}/telemetry/robot/{deviceId}  机器人六轴   10Hz  QoS0
    tl/v1/{lineId}/telemetry/status              产线状态    1Hz  QoS1 retained
    tl/v1/{lineId}/event                         生产事件    触发 QoS1
    tl/v1/{lineId}/edge/status                   边缘在线    连接时 QoS1 retained
    tl/v1/{lineId}/cmd/+                         ★订阅★ 指令下行 QoS1
    tl/v1/{lineId}/cmd_ack                       指令回执    每指令一次 QoS1

【四、MQTT 的几个关键机制在本文件里怎么用】

  1) retained（保留消息）
     publish(..., retain=True) 的消息会被 Broker 存下来。
     任何**后来**订阅该主题的客户端，都会立刻收到这条"最后一条"消息。
     → 用途：产线状态、边缘在线状态。
        新启动的后端不用等下一个周期，马上就知道当前状态。
        ★注意：retained 消息在客户端断开时仍留在 Broker 里，
                所以"最后已知状态"不会因为客户端重启而丢失。

  2) LWT / 遗嘱消息（Last Will and Testament）
     client.will_set(topic, payload, qos, retain) —— 登记一条"遗嘱"。
     如果客户端**非正常断开**（进程崩溃 / 网线被拔 / 机器断电），
     Broker 会自动代发这条遗嘱消息。
     → 用途：产线离线状态**自动产生，无需心跳轮询**。
        正常退出时会主动发 offline 并清除遗嘱（见代码注释）。

  3) QoS
     QoS0 = 最多一次（不确认，丢就丢了）→ 用于高频机器人帧（丢了就丢了，下一帧马上来）
     QoS1 = 至少一次（会重发，可能重复）→ 用于状态、事件、指令（不能丢）

  4) 幂等要求
     因为 QoS1 可能重复投递，**后端必须做幂等**（UPSERT + cmdId 状态机）。

【五、运行与配置】

    运行：python mock_collector.py
    配置（环境变量）：
      MQTT_HOST       Broker 地址，默认 localhost
      MQTT_PORT       Broker 端口，默认 1883
      MQTT_USERNAME   认证账号（空 = 匿名）
      MQTT_PASSWORD   认证密码
      LINE_ID         产线编码，默认 line-01（必须与数据库 production_lines.code 一致）
      ROBOT_ID        机器人编码，默认 robot-01（必须与数据库 devices.code 一致）
"""

import json          # JSON 序列化
import math          # 数学函数（sin / pi）
import os            # 读取环境变量
import random        # 随机数（模拟报警间隔、NG 比例）
import time          # 时间戳、sleep

import paho.mqtt.client as mqtt  # Eclipse Paho MQTT 客户端库（Python 最主流的 MQTT 库）

# ---------------------------------------------------------------------------
# 一、配置区（从环境变量读取，带默认值）
# ---------------------------------------------------------------------------

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

# ---------------------------------------------------------------------------
# 二、主题定义（严格遵守数据契约 docs/contract/README.md）
# ---------------------------------------------------------------------------

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
BEAT_SECONDS = 8.5
# 机器人关节数据发布频率（Hz）
ROBOT_HZ = 10


# ---------------------------------------------------------------------------
# 三、工具函数
# ---------------------------------------------------------------------------

def now_ms() -> int:
    """当前时间戳（Unix 毫秒）。契约规定 ts 由"产生方(边缘)"打。"""
    return int(time.time() * 1000)


def pub(client, topic, obj, qos=0, retain=False):
    """
    发布一条 MQTT 消息。

    :param client:  paho 客户端
    :param topic:   主题
    :param obj:     要发送的 Python 对象（会被序列化成 JSON）
    :param qos:     服务质量等级 0/1/2
    :param retain:  是否保留消息
    """
    # ensure_ascii=False → 中文不转义（否则看到的是 \uXXXX）
    client.publish(topic, json.dumps(obj, ensure_ascii=False), qos=qos, retain=retain)


# ---------------------------------------------------------------------------
# 四、下行指令处理（mock 版）
# ---------------------------------------------------------------------------

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
            "cmdId": cmd.get("cmdId"),   # ★ 指令唯一标识（原样回传）
            "status": "acked",            # acked=已执行 / rejected=被拒 / failed=失败
            "message": "mock 已执行",
        }, qos=1)
    except Exception as exc:  # mock 阶段宽容处理,不让异常打断主循环
        # 真实采集器里这里应该：记录日志 + 回 failed 回执
        print(f"[cmd] 处理失败: {exc}")


# ---------------------------------------------------------------------------
# 五、主函数：连接 → 订阅 → 循环发布
# ---------------------------------------------------------------------------

def main():
    """采集器主入口。"""

    # ---- 1. 创建 MQTT 客户端 ----
    # CallbackAPIVersion.VERSION2 = paho 2.x 的回调签名规范
    # client_id 必须唯一（同一时刻两个客户端用同一个 ID，Broker 会踢掉前一个）
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2,
                         client_id=f"edge-mock-{LINE_ID}")

    # ---- 2. 配置认证 ----
    if MQTT_USERNAME:
        client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)

    # ---- 3. 设置遗嘱消息（LWT）----
    # LWT:异常掉线时 Broker 自动发布 retained offline —— 产线离线状态由此而来
    # 原理：我们告诉 Broker"如果我异常消失了，帮我发这条消息"。
    #       Broker 会在客户端**非正常断开**时（心跳超时/网络断开）自动发布。
    #       正常关闭连接时（client.disconnect()）不会发遗嘱 —— 所以正常下线
    #       时我们要自己发一条 offline（见 main 函数末尾的说明）。
    client.will_set(
        T_EDGE,                                                   # 遗嘱主题
        json.dumps({"ts": now_ms(), "lineId": LINE_ID, "status": "offline"}),
        qos=1, retain=True,                                       # QoS1 + 保留
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

    # ---- 10. 六轴仿真参数 ----
    # 每个关节用「基值 + 幅值 * sin(2π * 频率 * t)」生成。
    # 各轴频率不同 → 运动看起来更自然（真实机械臂各关节节奏本来就不同）。
    base = [0.0, -30.0, 45.0, 0.0, 60.0, 0.0]   # 中心位置（度）
    amp  = [60.0, 20.0, 25.0, 45.0, 30.0, 90.0] # 摆动幅度（度）
    freq = [0.10, 0.13, 0.11, 0.07, 0.09, 0.15]  # 频率（Hz）

    # ---- 11. 循环状态变量 ----
    t0 = time.time()          # 起始时刻，用于算经过的时间
    last_status = 0.0         # 上次发状态的时间戳
    last_beat = -1            # 上一次处理的节拍序号
    seq = 0                   # 工件序号
    next_alarm = t0 + random.uniform(90, 180)  # 下次报警时间（启动后 90~180 秒随机）

    # 启动提示
    print(f"mock collector 已启动  broker={MQTT_HOST}:{MQTT_PORT}  line={LINE_ID}")

    try:
        # ---- 12. 主循环：按 ROBOT_HZ 频率发布数据 ----
        while True:
            t = time.time() - t0    # 启动后经过的秒数
            now = time.time()       # 当前绝对时刻

            # ========== ① 机器人六轴遥测 @10Hz ==========
            # 用 zip 同时遍历 base/amp/freq，生成 6 个关节角
            joints = [round(b + a * math.sin(2 * math.pi * f * t), 3)
                      for b, a, f in zip(base, amp, freq)]
            pub(client, T_ROBOT, {
                "ts": now_ms(), "deviceId": ROBOT_ID,
                "joints": joints,                      # ★ 必填字段，6 个角度
                "tcp": None,  # mock 不做运动学正解;现场若 PLC 提供则填实际值
                "speedPct": 80, "mode": "auto",
                "program": "MOCK_CYCLE", "alarmCode": 0,
            }, qos=0)   # 高频数据用 QoS0，丢一帧无所谓

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
        # ★ 注意：正常退出时 **不会** 触发 LWT（那是给异常断开用的）。
        #   所以正常下线应该主动发一条 offline。生产版采集器必须加这一步，
        #   否则正常停机时页面会一直显示"在线"。
        #   （当前 mock 没做，属于小缺陷；现场实现时务必补上）


# ---------------------------------------------------------------------------
# 六、程序入口
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # 只有直接运行本文件时才执行 main()（被 import 时不执行）
    main()
