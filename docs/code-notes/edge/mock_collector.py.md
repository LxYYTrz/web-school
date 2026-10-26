# edge/mock_collector.py 逐行注释

[打开源码](../../../edge/mock_collector.py) · 217 行 · 109 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 12 行**

```text
import json
# 注释：从 Python 环境 导入 json，供后续代码使用。 关键字：`import`＝导入模块或符号。
```

**源码第 13 行**

```text
import math
# 注释：从 Python 环境 导入 math，供后续代码使用。 关键字：`import`＝导入模块或符号。
```

**源码第 14 行**

```text
import os
# 注释：从 Python 环境 导入 os，供后续代码使用。 关键字：`import`＝导入模块或符号。
```

**源码第 15 行**

```text
import random
# 注释：从 Python 环境 导入 random，供后续代码使用。 关键字：`import`＝导入模块或符号。
```

**源码第 16 行**

```text
import time
# 注释：从 Python 环境 导入 time，供后续代码使用。 关键字：`import`＝导入模块或符号。
```

**源码第 18 行**

```text
import paho.mqtt.client as mqtt
# 注释：从 Python 环境 导入 paho.mqtt.client as mqtt，供后续代码使用。 关键字：`import`＝导入模块或符号；`as`＝为导入或上下文对象命名。
```

**源码第 21 行**

```text
MQTT_HOST = os.getenv("MQTT_HOST", "localhost")
# 注释：给 `MQTT_HOST` 赋值。
```

**源码第 23 行**

```text
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
# 注释：给 `MQTT_PORT` 赋值。
```

**源码第 26 行**

```text
MQTT_USERNAME = os.getenv("MQTT_USERNAME") or None
# 注释：给 `MQTT_USERNAME` 赋值。 关键字：`or`＝逻辑或；`None`＝空值。
```

**源码第 27 行**

```text
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD") or None
# 注释：给 `MQTT_PASSWORD` 赋值。 关键字：`or`＝逻辑或；`None`＝空值。
```

**源码第 29 行**

```text
LINE_ID = os.getenv("LINE_ID", "line-01")
# 注释：给 `LINE_ID` 赋值。
```

**源码第 31 行**

```text
ROBOT_ID = os.getenv("ROBOT_ID", "robot-01")
# 注释：给 `ROBOT_ID` 赋值。
```

**源码第 34 行**

```text
T_ROBOT  = f"tl/v1/{LINE_ID}/telemetry/robot/{ROBOT_ID}"
# 注释：给 `T_ROBOT` 赋值。
```

**源码第 36 行**

```text
T_STATUS = f"tl/v1/{LINE_ID}/telemetry/status"
# 注释：给 `T_STATUS` 赋值。
```

**源码第 38 行**

```text
T_EVENT  = f"tl/v1/{LINE_ID}/event"
# 注释：给 `T_EVENT` 赋值。
```

**源码第 40 行**

```text
T_EDGE   = f"tl/v1/{LINE_ID}/edge/status"
# 注释：给 `T_EDGE` 赋值。
```

**源码第 43 行**

```text
T_CMD    = f"tl/v1/{LINE_ID}/cmd/+"
# 注释：给 `T_CMD` 赋值。
```

**源码第 45 行**

```text
T_ACK    = f"tl/v1/{LINE_ID}/cmd_ack"
# 注释：给 `T_ACK` 赋值。
```

**源码第 48 行**

```text
BEAT_SECONDS = 8.5   # 模拟节拍:每 8.5s 出一件
# 注释：给 `BEAT_SECONDS` 赋值。
```

**源码第 50 行**

```text
ROBOT_HZ = 10        # 关节数据发布频率
# 注释：给 `ROBOT_HZ` 赋值。
```

**源码第 53 行**

```text
def now_ms() -> int:
# 注释：定义函数 `now_ms`。 关键字：`def`＝定义 Python 函数。
```

**源码第 54 行**

```text
    return int(time.time() * 1000)
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 57 行**

```text
def pub(client, topic, obj, qos=0, retain=False):
# 注释：定义函数 `pub`。 关键字：`def`＝定义 Python 函数；`False`＝布尔假值。
```

**源码第 59 行**

```text
    client.publish(topic, json.dumps(obj, ensure_ascii=False), qos=qos, retain=retain)
# 注释：调用函数或对象方法并传入参数。 关键字：`False`＝布尔假值。
```

**源码第 62 行**

```text
def on_message(client, userdata, msg):
# 注释：定义函数 `on_message`。 关键字：`def`＝定义 Python 函数。
```

**源码第 65 行**

```text
    try:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。
```

**源码第 67 行**

```text
        cmd = json.loads(msg.payload.decode("utf-8"))
# 注释：给 `cmd` 赋值。
```

**源码第 69 行**

```text
        print(f"[cmd] 收到指令 type={cmd.get('type')} topic={msg.topic}")
# 注释：调用函数或对象方法并传入参数。 关键字：type＝定义类型别名。
```

**源码第 71 行**

```text
        time.sleep(0.3)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 73 行**

```text
        pub(client, T_ACK, {
# 注释：调用函数或对象方法并传入参数。
```

**源码第 74 行**

```text
            "ts": now_ms(),
# 注释：设置字段 ts，值为 now_ms()。
```

**源码第 75 行**

```text
            "cmdId": cmd.get("cmdId"),
# 注释：设置字段 cmdId，值为 cmd.get("cmdId")。
```

**源码第 76 行**

```text
            "status": "acked",
# 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 77 行**

```text
            "message": "mock 已执行",
# 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 78 行**

```text
        }, qos=1)
# 注释：结束当前对象、函数或条件代码块。
```

**源码第 79 行**

```text
    except Exception as exc:  # mock 阶段宽容处理,不让异常打断主循环
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常；`as`＝为导入或上下文对象命名。
```

**源码第 81 行**

```text
        print(f"[cmd] 处理失败: {exc}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 84 行**

```text
def main():
# 注释：定义函数 `main`。 关键字：`def`＝定义 Python 函数。
```

**源码第 88 行**

```text
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2,
# 注释：给 `client` 赋值。
```

**源码第 89 行**

```text
                         client_id=f"edge-mock-{LINE_ID}")
# 注释：给 `client_id` 赋值。
```

**源码第 91 行**

```text
    if MQTT_USERNAME:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 92 行**

```text
        client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 100 行**

```text
    client.will_set(
# 注释：调用函数或对象方法并传入参数。
```

**源码第 101 行**

```text
        T_EDGE,
# 注释：把变量 T_EDGE 作为同名对象字段加入当前对象。
```

**源码第 102 行**

```text
        json.dumps({"ts": now_ms(), "lineId": LINE_ID, "status": "offline"}),
# 注释：调用函数或对象方法并传入参数。
```

**源码第 103 行**

```text
        qos=1, retain=True,
# 注释：给 `qos` 赋值。 关键字：`True`＝布尔真值。
```

**源码第 104 行**

```text
    )
# 注释：结束当前集合、分组或调用参数。
```

**源码第 107 行**

```text
    client.on_message = on_message
# 注释：把 on_message 的结果赋给 client.on_message。
```

**源码第 110 行**

```text
    client.connect(MQTT_HOST, MQTT_PORT, keepalive=30)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 113 行**

```text
    client.subscribe(T_CMD, qos=1)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 116 行**

```text
    client.loop_start()
# 注释：调用函数或对象方法并传入参数。
```

**源码第 121 行**

```text
    pub(client, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "online"},
# 注释：调用函数或对象方法并传入参数。
```

**源码第 122 行**

```text
        qos=1, retain=True)
# 注释：给 `qos` 赋值。 关键字：`True`＝布尔真值。
```

**源码第 124 行**

```text
    pub(client, T_EVENT, {"ts": now_ms(), "lineId": LINE_ID, "deviceId": "plc-01",
# 注释：调用函数或对象方法并传入参数。
```

**源码第 125 行**

```text
                          "type": "start", "level": "info",
# 注释：把这一段文字作为当前调用、数组或对象的值。 关键字：type＝定义类型别名。
```

**源码第 126 行**

```text
                          "message": "产线启动(mock)"}, qos=1)
# 注释：设置字段 message，值为 "产线启动(mock)"}, qos=1)。
```

**源码第 132 行**

```text
    base = [0.0, -30.0, 45.0, 0.0, 60.0, 0.0]
# 注释：给 `base` 赋值。
```

**源码第 133 行**

```text
    amp  = [60.0, 20.0, 25.0, 45.0, 30.0, 90.0]
# 注释：给 `amp` 赋值。
```

**源码第 134 行**

```text
    freq = [0.10, 0.13, 0.11, 0.07, 0.09, 0.15]
# 注释：给 `freq` 赋值。
```

**源码第 137 行**

```text
    t0 = time.time()
# 注释：给 `t0` 赋值。
```

**源码第 138 行**

```text
    last_status = 0.0
# 注释：给 `last_status` 赋值。
```

**源码第 139 行**

```text
    last_beat = -1
# 注释：给 `last_beat` 赋值。
```

**源码第 140 行**

```text
    seq = 0
# 注释：给 `seq` 赋值。
```

**源码第 141 行**

```text
    next_alarm = t0 + random.uniform(90, 180)
# 注释：给 `next_alarm` 赋值。
```

**源码第 144 行**

```text
    print(f"mock collector 已启动  broker={MQTT_HOST}:{MQTT_PORT}  line={LINE_ID}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 145 行**

```text
    try:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。
```

**源码第 147 行**

```text
        while True:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`while`＝按条件重复执行；`True`＝布尔真值。
```

**源码第 148 行**

```text
            t = time.time() - t0
# 注释：给 `t` 赋值。
```

**源码第 149 行**

```text
            now = time.time()
# 注释：给 `now` 赋值。
```

**源码第 154 行**

```text
            joints = [round(b + a * math.sin(2 * math.pi * f * t), 3)
# 注释：给 `joints` 赋值。
```

**源码第 155 行**

```text
                      for b, a, f in zip(base, amp, freq)]
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 156 行**

```text
            pub(client, T_ROBOT, {
# 注释：调用函数或对象方法并传入参数。
```

**源码第 157 行**

```text
                "ts": now_ms(), "deviceId": ROBOT_ID,
# 注释：设置字段 ts，值为 now_ms(), "deviceId": ROBOT_ID。
```

**源码第 158 行**

```text
                "joints": joints,
# 注释：设置字段 joints，值为 joints。
```

**源码第 159 行**

```text
                "tcp": None,  # mock 不做运动学正解;现场若 PLC 提供则填实际值
# 注释：设置字段 tcp，值为 None,  # mock 不做运动学正解;现场若 PLC 提供则填实际值。 关键字：`None`＝空值。
```

**源码第 160 行**

```text
                "speedPct": 80, "mode": "auto",
# 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 161 行**

```text
                "program": "MOCK_CYCLE", "alarmCode": 0,
# 注释：设置字段 program，值为 "MOCK_CYCLE", "alarmCode": 0。
```

**源码第 162 行**

```text
            }, qos=0)
# 注释：结束当前对象、函数或条件代码块。
```

**源码第 167 行**

```text
            beat_index = int(t // BEAT_SECONDS)
# 注释：给 `beat_index` 赋值。
```

**源码第 169 行**

```text
            if now - last_status >= 1.0:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 170 行**

```text
                last_status = now
# 注释：给 `last_status` 赋值。
```

**源码第 171 行**

```text
                ng = beat_index // 50  # 每 50 件出 1 件 NG
# 注释：给 `ng` 赋值。
```

**源码第 172 行**

```text
                pub(client, T_STATUS, {
# 注释：调用函数或对象方法并传入参数。
```

**源码第 173 行**

```text
                    "ts": now_ms(), "lineId": LINE_ID, "state": "running",
# 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 174 行**

```text
                    "productCode": "MOCK-P1",
# 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 175 行**

```text
                    "goodCount": beat_index - ng, "ngCount": ng,
# 注释：设置字段 goodCount，值为 beat_index - ng, "ngCount": ng。
```

**源码第 176 行**

```text
                    "beatMs": int(BEAT_SECONDS * 1000),
# 注释：设置字段 beatMs，值为 int(BEAT_SECONDS * 1000)。
```

**源码第 177 行**

```text
                }, qos=1, retain=True)
# 注释：结束当前对象、函数或条件代码块。 关键字：`True`＝布尔真值。
```

**源码第 182 行**

```text
            if beat_index != last_beat and t >= 1:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`and`＝逻辑与。
```

**源码第 183 行**

```text
                last_beat = beat_index
# 注释：给 `last_beat` 赋值。
```

**源码第 184 行**

```text
                seq += 1
# 注释：用 1 更新 seq；+= 表示先计算再赋回。
```

**源码第 186 行**

```text
                sn = f"SN{time.strftime('%Y%m%d')}{seq:05d}"
# 注释：给 `sn` 赋值。
```

**源码第 187 行**

```text
                pub(client, T_EVENT, {
# 注释：调用函数或对象方法并传入参数。
```

**源码第 188 行**

```text
                    "ts": now_ms(), "lineId": LINE_ID, "deviceId": ROBOT_ID,
# 注释：设置字段 ts，值为 now_ms(), "lineId": LINE_ID, "deviceId": ROBOT_ID。
```

**源码第 189 行**

```text
                    "type": "piece_done", "level": "info",
# 注释：把这一段文字作为当前调用、数组或对象的值。 关键字：type＝定义类型别名。
```

**源码第 190 行**

```text
                    "message": f"工件 {sn} 完成",
# 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 191 行**

```text
                }, qos=1)
# 注释：结束当前对象、函数或条件代码块。
```

**源码第 195 行**

```text
            if now >= next_alarm:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 197 行**

```text
                next_alarm = now + random.uniform(90, 180)
# 注释：给 `next_alarm` 赋值。
```

**源码第 198 行**

```text
                pub(client, T_EVENT, {
# 注释：调用函数或对象方法并传入参数。
```

**源码第 199 行**

```text
                    "ts": now_ms(), "lineId": LINE_ID, "deviceId": "plc-01",
# 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 200 行**

```text
                    "type": "alarm", "level": "warning",
# 注释：把这一段文字作为当前调用、数组或对象的值。 关键字：type＝定义类型别名。
```

**源码第 201 行**

```text
                    "code": "W201", "message": "气源压力偏低(mock)",
# 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 202 行**

```text
                }, qos=1)
# 注释：结束当前对象、函数或条件代码块。
```

**源码第 206 行**

```text
            time.sleep(1.0 / ROBOT_HZ)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 207 行**

```text
    except KeyboardInterrupt:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常。
```

**源码第 209 行**

```text
        print("停止 mock collector")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 215 行**

```text
if __name__ == "__main__":
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 217 行**

```text
    main()
# 注释：调用函数或对象方法并传入参数。
```
