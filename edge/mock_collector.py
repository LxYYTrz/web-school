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
# 从 Python 环境 导入 json，供后续代码使用。 关键字：import＝导入模块或符号。
import math
# 从 Python 环境 导入 math，供后续代码使用。 关键字：import＝导入模块或符号。
import os
# 从 Python 环境 导入 os，供后续代码使用。 关键字：import＝导入模块或符号。
import random
# 从 Python 环境 导入 random，供后续代码使用。 关键字：import＝导入模块或符号。
import time
# 从 Python 环境 导入 time，供后续代码使用。 关键字：import＝导入模块或符号。

import paho.mqtt.client as mqtt
# 从 Python 环境 导入 paho.mqtt.client as mqtt，供后续代码使用。 关键字：import＝导入模块或符号；as＝为导入或上下文对象命名。

# MQTT Broker 的主机地址，默认本机。
MQTT_HOST = os.getenv("MQTT_HOST", "localhost")
# 给 MQTT_HOST 赋值。
# MQTT Broker 的端口。1883 = 明文；8883 = TLS 加密（生产用）
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
# 给 MQTT_PORT 赋值。
# 认证账号密码。os.getenv 默认 None；`or None` 把空字符串也归一成 None
# （None = 匿名登录，非 None = 用账号密码）
MQTT_USERNAME = os.getenv("MQTT_USERNAME") or None
# 给 MQTT_USERNAME 赋值。 关键字：or＝逻辑或；None＝空值。
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD") or None
# 给 MQTT_PASSWORD 赋值。 关键字：or＝逻辑或；None＝空值。
# 产线编码：必须与数据库 production_lines.code 一致（后端靠它把 code 翻译成主键）
LINE_ID = os.getenv("LINE_ID", "line-01")
# 给 LINE_ID 赋值。
# 机器人设备编码：必须与数据库 devices.code 一致
ROBOT_ID = os.getenv("ROBOT_ID", "robot-01")
# 给 ROBOT_ID 赋值。

# 机器人六轴遥测主题（上行，10Hz）
T_ROBOT  = f"tl/v1/{LINE_ID}/telemetry/robot/{ROBOT_ID}"
# 给 T_ROBOT 赋值。
# 产线状态主题（上行，1Hz，retained）
T_STATUS = f"tl/v1/{LINE_ID}/telemetry/status"
# 给 T_STATUS 赋值。
# 生产事件主题（上行，事件触发）
T_EVENT  = f"tl/v1/{LINE_ID}/event"
# 给 T_EVENT 赋值。
# 边缘在线状态主题（上行，retained + LWT）
T_EDGE   = f"tl/v1/{LINE_ID}/edge/status"
# 给 T_EDGE 赋值。
# ★ 控制指令主题（下行，我们订阅它）。末尾的 + 是 MQTT 单层通配符，
#   意思是"这条产线下所有设备的指令我都收"
T_CMD    = f"tl/v1/{LINE_ID}/cmd/+"
# 给 T_CMD 赋值。
# 指令回执主题（上行）
T_ACK    = f"tl/v1/{LINE_ID}/cmd_ack"
# 给 T_ACK 赋值。

# 模拟节拍：每 8.5 秒出一件（真实节拍由 PLC 决定）
BEAT_SECONDS = 8.5   # 模拟节拍:每 8.5s 出一件
# 给 BEAT_SECONDS 赋值。
# 机器人关节数据发布频率（Hz）
ROBOT_HZ = 10        # 关节数据发布频率
# 给 ROBOT_HZ 赋值。


def now_ms() -> int:
# 定义函数 now_ms。 关键字：def＝定义 Python 函数。
    return int(time.time() * 1000)
    # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。


def pub(client, topic, obj, qos=0, retain=False):
# 定义函数 pub。 关键字：def＝定义 Python 函数；False＝布尔假值。
    # ensure_ascii=False → 中文不转义（否则看到的是 \uXXXX）
    client.publish(topic, json.dumps(obj, ensure_ascii=False), qos=qos, retain=retain)
    # 调用函数或对象方法并传入参数。 关键字：False＝布尔假值。


def on_message(client, userdata, msg):
# 定义函数 on_message。 关键字：def＝定义 Python 函数。
    """控制指令 mock:收到指令 0.3s 后回 ack(模拟 PLC 已执行)。
    真实采集器中,这里替换为"写 PLC 寄存器 → 等待 PLC 反馈"。"""
    try:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：try＝进入异常处理块。
        # 解析指令 JSON
        cmd = json.loads(msg.payload.decode("utf-8"))
        # 给 cmd 赋值。
        # 打印收到的指令（联调时肉眼可见）
        print(f"[cmd] 收到指令 type={cmd.get('type')} topic={msg.topic}")
        # 调用函数或对象方法并传入参数。 关键字：type＝定义类型别名。
        # 模拟 PLC 执行耗时（真实场景是等 PLC 写完寄存器再反馈）
        time.sleep(0.3)
        # 调用函数或对象方法并传入参数。
        # 回执：cmdId 必须原样带回，后端靠它更新 control_commands 的状态
        pub(client, T_ACK, {
        # 调用函数或对象方法并传入参数。
            "ts": now_ms(),
            # 设置字段 ts，值为 now_ms()。
            "cmdId": cmd.get("cmdId"),
            # 设置字段 cmdId，值为 cmd.get("cmdId")。
            "status": "acked",
            # 把这一段文字作为当前调用、数组或对象的值。
            "message": "mock 已执行",
            # 把这一段文字作为当前调用、数组或对象的值。
        }, qos=1)
        # 结束当前对象、函数或条件代码块。
    except Exception as exc:  # mock 阶段宽容处理,不让异常打断主循环
    # 控制后续缩进代码块的执行条件或顺序。 关键字：except＝处理指定异常；as＝为导入或上下文对象命名。
        # 真实采集器里这里应该：记录日志 + 回 failed 回执
        print(f"[cmd] 处理失败: {exc}")
        # 调用函数或对象方法并传入参数。


def main():
# 定义函数 main。 关键字：def＝定义 Python 函数。
    # ---- 1. 创建 MQTT 客户端 ----
    # CallbackAPIVersion.VERSION2 = paho 2.x 的回调签名规范
    # client_id 必须唯一（同一时刻两个客户端用同一个 ID，Broker 会踢掉前一个）
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2,
    # 给 client 赋值。
                         client_id=f"edge-mock-{LINE_ID}")
                         # 给 client_id 赋值。
    # ---- 2. 配置认证 ----
    if MQTT_USERNAME:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
        client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
        # 调用函数或对象方法并传入参数。
    # LWT:异常掉线时 Broker 自动发布 retained offline —— 产线离线状态由此而来
    # ---- 3. 设置遗嘱消息（LWT）----
    # LWT:异常掉线时 Broker 自动发布 retained offline —— 产线离线状态由此而来
    # 原理：我们告诉 Broker"如果我异常消失了，帮我发这条消息"。
    #       Broker 会在客户端**非正常断开**时（心跳超时/网络断开）自动发布。
    #       正常关闭连接时（client.disconnect()）不会发遗嘱 —— 所以正常下线
    #       时我们要自己发一条 offline（见 main 函数末尾的说明）。
    client.will_set(
    # 调用函数或对象方法并传入参数。
        T_EDGE,
        # 把变量 T_EDGE 作为同名对象字段加入当前对象。
        json.dumps({"ts": now_ms(), "lineId": LINE_ID, "status": "offline"}),
        # 调用函数或对象方法并传入参数。
        qos=1, retain=True,
        # 给 qos 赋值。 关键字：True＝布尔真值。
    )
    # 结束当前集合、分组或调用参数。
    # ---- 4. 注册消息回调 ----
    # 收到下行指令时会调用 on_message
    client.on_message = on_message
    # 把 on_message 的结果赋给 client.on_message。
    # ---- 5. 建立连接 ----
    # connect 是阻塞的（会做 TCP 连接 + MQTT CONNECT/SUBACK 握手）
    client.connect(MQTT_HOST, MQTT_PORT, keepalive=30)
    # 调用函数或对象方法并传入参数。
    # ---- 6. 订阅下行指令主题 ----
    # QoS1：指令不能丢
    client.subscribe(T_CMD, qos=1)
    # 调用函数或对象方法并传入参数。
    # ---- 7. 启动网络线程 ----
    # paho 的收发循环跑在后台线程里。不调用 loop_start() 就没有网络收发能力。
    client.loop_start()
    # 调用函数或对象方法并传入参数。

    # ---- 8. 发布"边缘在线"（retained）----
    # 因为是 retained，后端**任何时候**订阅都能立刻拿到这条 online。
    # 这就实现了"后端晚启动也能立刻知道边缘在线"。
    pub(client, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "online"},
    # 调用函数或对象方法并传入参数。
        qos=1, retain=True)
        # 给 qos 赋值。 关键字：True＝布尔真值。
    # ---- 9. 发布一条"产线启动"事件（让页面的事件流一开始就有内容）----
    pub(client, T_EVENT, {"ts": now_ms(), "lineId": LINE_ID, "deviceId": "plc-01",
    # 调用函数或对象方法并传入参数。
                          "type": "start", "level": "info",
                          # 把这一段文字作为当前调用、数组或对象的值。 关键字：type＝定义类型别名。
                          "message": "产线启动(mock)"}, qos=1)
                          # 设置字段 message，值为 "产线启动(mock)"}, qos=1)。

    # 六轴仿真参数:基值 + 幅值 * sin,各轴频率不同,运动看起来更自然
    # ---- 10. 六轴仿真参数 ----
    # 每个关节用「基值 + 幅值 * sin(2π * 频率 * t)」生成。
    # 各轴频率不同 → 运动看起来更自然（真实机械臂各关节节奏本来就不同）。
    base = [0.0, -30.0, 45.0, 0.0, 60.0, 0.0]
    # 给 base 赋值。
    amp  = [60.0, 20.0, 25.0, 45.0, 30.0, 90.0]
    # 给 amp 赋值。
    freq = [0.10, 0.13, 0.11, 0.07, 0.09, 0.15]
    # 给 freq 赋值。

    # ---- 11. 循环状态变量 ----
    t0 = time.time()
    # 给 t0 赋值。
    last_status = 0.0
    # 给 last_status 赋值。
    last_beat = -1
    # 给 last_beat 赋值。
    seq = 0
    # 给 seq 赋值。
    next_alarm = t0 + random.uniform(90, 180)
    # 给 next_alarm 赋值。

    # 启动提示
    print(f"mock collector 已启动  broker={MQTT_HOST}:{MQTT_PORT}  line={LINE_ID}")
    # 调用函数或对象方法并传入参数。
    try:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：try＝进入异常处理块。
        # ---- 12. 主循环：按 ROBOT_HZ 频率发布数据 ----
        while True:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：while＝按条件重复执行；True＝布尔真值。
            t = time.time() - t0
            # 给 t 赋值。
            now = time.time()
            # 给 now 赋值。

            # 1) 机器人六轴遥测 @10Hz
            # ========== ① 机器人六轴遥测 @10Hz ==========
            # 用 zip 同时遍历 base/amp/freq，生成 6 个关节角
            joints = [round(b + a * math.sin(2 * math.pi * f * t), 3)
            # 给 joints 赋值。
                      for b, a, f in zip(base, amp, freq)]
                      # 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
            pub(client, T_ROBOT, {
            # 调用函数或对象方法并传入参数。
                "ts": now_ms(), "deviceId": ROBOT_ID,
                # 设置字段 ts，值为 now_ms(), "deviceId": ROBOT_ID。
                "joints": joints,
                # 设置字段 joints，值为 joints。
                "tcp": None,  # mock 不做运动学正解;现场若 PLC 提供则填实际值
                # 设置字段 tcp，值为 None,  # mock 不做运动学正解;现场若 PLC 提供则填实际值。 关键字：None＝空值。
                "speedPct": 80, "mode": "auto",
                # 把这一段文字作为当前调用、数组或对象的值。
                "program": "MOCK_CYCLE", "alarmCode": 0,
                # 设置字段 program，值为 "MOCK_CYCLE", "alarmCode": 0。
            }, qos=0)
            # 结束当前对象、函数或条件代码块。

            # 2) 产线状态快照 @1Hz(retained)
            # ========== ② 产线状态快照 @1Hz(retained) ==========
            # beat_index = 已经过了多少个节拍周期（整数）
            beat_index = int(t // BEAT_SECONDS)
            # 给 beat_index 赋值。
            # 每秒最多发一次
            if now - last_status >= 1.0:
            # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
                last_status = now
                # 给 last_status 赋值。
                ng = beat_index // 50  # 每 50 件出 1 件 NG
                # 给 ng 赋值。
                pub(client, T_STATUS, {
                # 调用函数或对象方法并传入参数。
                    "ts": now_ms(), "lineId": LINE_ID, "state": "running",
                    # 把这一段文字作为当前调用、数组或对象的值。
                    "productCode": "MOCK-P1",
                    # 把这一段文字作为当前调用、数组或对象的值。
                    "goodCount": beat_index - ng, "ngCount": ng,
                    # 设置字段 goodCount，值为 beat_index - ng, "ngCount": ng。
                    "beatMs": int(BEAT_SECONDS * 1000),
                    # 设置字段 beatMs，值为 int(BEAT_SECONDS * 1000)。
                }, qos=1, retain=True)
                # 结束当前对象、函数或条件代码块。 关键字：True＝布尔真值。

            # 3) 每件一次:piece_done 事件
            # ========== ③ 每件一次:单件完成事件 ==========
            # 节拍序号变了 → 说明又出了一件
            if beat_index != last_beat and t >= 1:
            # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；and＝逻辑与。
                last_beat = beat_index
                # 给 last_beat 赋值。
                seq += 1
                # 用 1 更新 seq；+= 表示先计算再赋回。
                # 工件序列号：SN + 日期 + 5 位序号
                sn = f"SN{time.strftime('%Y%m%d')}{seq:05d}"
                # 给 sn 赋值。
                pub(client, T_EVENT, {
                # 调用函数或对象方法并传入参数。
                    "ts": now_ms(), "lineId": LINE_ID, "deviceId": ROBOT_ID,
                    # 设置字段 ts，值为 now_ms(), "lineId": LINE_ID, "deviceId": ROBOT_ID。
                    "type": "piece_done", "level": "info",
                    # 把这一段文字作为当前调用、数组或对象的值。 关键字：type＝定义类型别名。
                    "message": f"工件 {sn} 完成",
                    # 把这一段文字作为当前调用、数组或对象的值。
                }, qos=1)
                # 结束当前对象、函数或条件代码块。

            # 4) 偶发告警(90~180s 随机)
            # ========== ④ 偶发告警(90~180s 随机) ==========
            if now >= next_alarm:
            # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
                # 排下一次报警时间
                next_alarm = now + random.uniform(90, 180)
                # 给 next_alarm 赋值。
                pub(client, T_EVENT, {
                # 调用函数或对象方法并传入参数。
                    "ts": now_ms(), "lineId": LINE_ID, "deviceId": "plc-01",
                    # 把这一段文字作为当前调用、数组或对象的值。
                    "type": "alarm", "level": "warning",
                    # 把这一段文字作为当前调用、数组或对象的值。 关键字：type＝定义类型别名。
                    "code": "W201", "message": "气源压力偏低(mock)",
                    # 把这一段文字作为当前调用、数组或对象的值。
                }, qos=1)
                # 结束当前对象、函数或条件代码块。

            # ========== ⑤ 控制循环节奏 ==========
            # sleep(1/ROBOT_HZ) = 0.1 秒 → 每秒 10 次循环 → 10Hz
            time.sleep(1.0 / ROBOT_HZ)
            # 调用函数或对象方法并传入参数。
    except KeyboardInterrupt:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：except＝处理指定异常。
        # Ctrl+C 退出
        print("停止 mock collector")
        # 调用函数或对象方法并传入参数。


# ---------------------------------------------------------------------------
# 六、程序入口
# ---------------------------------------------------------------------------
if __name__ == "__main__":
# 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
    # 只有直接运行本文件时才执行 main()（被 import 时不执行）
    main()
    # 调用函数或对象方法并传入参数。
