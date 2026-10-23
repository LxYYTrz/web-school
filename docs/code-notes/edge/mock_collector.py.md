# edge/mock_collector.py 逐行说明

[打开源码](../../../edge/mock_collector.py) · 217 行 · 109 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 12 | <code>import json</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 13 | <code>import math</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 14 | <code>import os</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 15 | <code>import random</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 16 | <code>import time</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 18 | <code>import paho.mqtt.client as mqtt</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号；`as`＝为导入或上下文对象命名。 |
| 21 | <code>MQTT_HOST = os.getenv("MQTT_HOST", "localhost")</code> | 给 `MQTT_HOST` 赋值。 |
| 23 | <code>MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))</code> | 给 `MQTT_PORT` 赋值。 |
| 26 | <code>MQTT_USERNAME = os.getenv("MQTT_USERNAME") or None</code> | 给 `MQTT_USERNAME` 赋值。 关键字：`or`＝逻辑或；`None`＝空值。 |
| 27 | <code>MQTT_PASSWORD = os.getenv("MQTT_PASSWORD") or None</code> | 给 `MQTT_PASSWORD` 赋值。 关键字：`or`＝逻辑或；`None`＝空值。 |
| 29 | <code>LINE_ID = os.getenv("LINE_ID", "line-01")</code> | 给 `LINE_ID` 赋值。 |
| 31 | <code>ROBOT_ID = os.getenv("ROBOT_ID", "robot-01")</code> | 给 `ROBOT_ID` 赋值。 |
| 34 | <code>T_ROBOT  = f"tl/v1/{LINE_ID}/telemetry/robot/{ROBOT_ID}"</code> | 给 `T_ROBOT` 赋值。 |
| 36 | <code>T_STATUS = f"tl/v1/{LINE_ID}/telemetry/status"</code> | 给 `T_STATUS` 赋值。 |
| 38 | <code>T_EVENT  = f"tl/v1/{LINE_ID}/event"</code> | 给 `T_EVENT` 赋值。 |
| 40 | <code>T_EDGE   = f"tl/v1/{LINE_ID}/edge/status"</code> | 给 `T_EDGE` 赋值。 |
| 43 | <code>T_CMD    = f"tl/v1/{LINE_ID}/cmd/+"</code> | 给 `T_CMD` 赋值。 |
| 45 | <code>T_ACK    = f"tl/v1/{LINE_ID}/cmd_ack"</code> | 给 `T_ACK` 赋值。 |
| 48 | <code>BEAT_SECONDS = 8.5   # 模拟节拍:每 8.5s 出一件</code> | 给 `BEAT_SECONDS` 赋值。 |
| 50 | <code>ROBOT_HZ = 10        # 关节数据发布频率</code> | 给 `ROBOT_HZ` 赋值。 |
| 53 | <code>def now_ms() -&gt; int:</code> | 定义函数 `now_ms`。 关键字：`def`＝定义 Python 函数。 |
| 54 | <code>return int(time.time() * 1000)</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 57 | <code>def pub(client, topic, obj, qos=0, retain=False):</code> | 定义函数 `pub`。 关键字：`def`＝定义 Python 函数；`False`＝布尔假值。 |
| 59 | <code>client.publish(topic, json.dumps(obj, ensure_ascii=False), qos=qos, retain=retain)</code> | 调用函数或对象方法并传入参数。 关键字：`False`＝布尔假值。 |
| 62 | <code>def on_message(client, userdata, msg):</code> | 定义函数 `on_message`。 关键字：`def`＝定义 Python 函数。 |
| 65 | <code>try:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。 |
| 67 | <code>cmd = json.loads(msg.payload.decode("utf-8"))</code> | 给 `cmd` 赋值。 |
| 69 | <code>print(f"[cmd] 收到指令 type={cmd.get('type')} topic={msg.topic}")</code> | 调用函数或对象方法并传入参数。 |
| 71 | <code>time.sleep(0.3)</code> | 调用函数或对象方法并传入参数。 |
| 73 | <code>pub(client, T_ACK, {</code> | 调用函数或对象方法并传入参数。 |
| 74 | <code>"ts": now_ms(),</code> | 续写当前表达式、集合或调用。 |
| 75 | <code>"cmdId": cmd.get("cmdId"),</code> | 续写当前表达式、集合或调用。 |
| 76 | <code>"status": "acked",</code> | 续写当前表达式、集合或调用。 |
| 77 | <code>"message": "mock 已执行",</code> | 续写当前表达式、集合或调用。 |
| 78 | <code>}, qos=1)</code> | 续写当前表达式、集合或调用。 |
| 79 | <code>except Exception as exc:  # mock 阶段宽容处理,不让异常打断主循环</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常；`as`＝为导入或上下文对象命名。 |
| 81 | <code>print(f"[cmd] 处理失败: {exc}")</code> | 调用函数或对象方法并传入参数。 |
| 84 | <code>def main():</code> | 定义函数 `main`。 关键字：`def`＝定义 Python 函数。 |
| 88 | <code>client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2,</code> | 给 `client` 赋值。 |
| 89 | <code>client_id=f"edge-mock-{LINE_ID}")</code> | 给 `client_id` 赋值。 |
| 91 | <code>if MQTT_USERNAME:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 92 | <code>client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)</code> | 调用函数或对象方法并传入参数。 |
| 100 | <code>client.will_set(</code> | 调用函数或对象方法并传入参数。 |
| 101 | <code>T_EDGE,</code> | 续写当前表达式、集合或调用。 |
| 102 | <code>json.dumps({"ts": now_ms(), "lineId": LINE_ID, "status": "offline"}),</code> | 调用函数或对象方法并传入参数。 |
| 103 | <code>qos=1, retain=True,</code> | 给 `qos` 赋值。 关键字：`True`＝布尔真值。 |
| 104 | <code>)</code> | 续写当前表达式、集合或调用。 |
| 107 | <code>client.on_message = on_message</code> | 续写当前表达式、集合或调用。 |
| 110 | <code>client.connect(MQTT_HOST, MQTT_PORT, keepalive=30)</code> | 调用函数或对象方法并传入参数。 |
| 113 | <code>client.subscribe(T_CMD, qos=1)</code> | 调用函数或对象方法并传入参数。 |
| 116 | <code>client.loop_start()</code> | 调用函数或对象方法并传入参数。 |
| 121 | <code>pub(client, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "online"},</code> | 调用函数或对象方法并传入参数。 |
| 122 | <code>qos=1, retain=True)</code> | 给 `qos` 赋值。 关键字：`True`＝布尔真值。 |
| 124 | <code>pub(client, T_EVENT, {"ts": now_ms(), "lineId": LINE_ID, "deviceId": "plc-01",</code> | 调用函数或对象方法并传入参数。 |
| 125 | <code>"type": "start", "level": "info",</code> | 续写当前表达式、集合或调用。 |
| 126 | <code>"message": "产线启动(mock)"}, qos=1)</code> | 续写当前表达式、集合或调用。 |
| 132 | <code>base = [0.0, -30.0, 45.0, 0.0, 60.0, 0.0]</code> | 给 `base` 赋值。 |
| 133 | <code>amp  = [60.0, 20.0, 25.0, 45.0, 30.0, 90.0]</code> | 给 `amp` 赋值。 |
| 134 | <code>freq = [0.10, 0.13, 0.11, 0.07, 0.09, 0.15]</code> | 给 `freq` 赋值。 |
| 137 | <code>t0 = time.time()</code> | 给 `t0` 赋值。 |
| 138 | <code>last_status = 0.0</code> | 给 `last_status` 赋值。 |
| 139 | <code>last_beat = -1</code> | 给 `last_beat` 赋值。 |
| 140 | <code>seq = 0</code> | 给 `seq` 赋值。 |
| 141 | <code>next_alarm = t0 + random.uniform(90, 180)</code> | 给 `next_alarm` 赋值。 |
| 144 | <code>print(f"mock collector 已启动  broker={MQTT_HOST}:{MQTT_PORT}  line={LINE_ID}")</code> | 调用函数或对象方法并传入参数。 |
| 145 | <code>try:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。 |
| 147 | <code>while True:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`while`＝按条件重复执行；`True`＝布尔真值。 |
| 148 | <code>t = time.time() - t0</code> | 给 `t` 赋值。 |
| 149 | <code>now = time.time()</code> | 给 `now` 赋值。 |
| 154 | <code>joints = [round(b + a * math.sin(2 * math.pi * f * t), 3)</code> | 给 `joints` 赋值。 |
| 155 | <code>for b, a, f in zip(base, amp, freq)]</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 156 | <code>pub(client, T_ROBOT, {</code> | 调用函数或对象方法并传入参数。 |
| 157 | <code>"ts": now_ms(), "deviceId": ROBOT_ID,</code> | 续写当前表达式、集合或调用。 |
| 158 | <code>"joints": joints,</code> | 续写当前表达式、集合或调用。 |
| 159 | <code>"tcp": None,  # mock 不做运动学正解;现场若 PLC 提供则填实际值</code> | 续写当前表达式、集合或调用。 关键字：`None`＝空值。 |
| 160 | <code>"speedPct": 80, "mode": "auto",</code> | 续写当前表达式、集合或调用。 |
| 161 | <code>"program": "MOCK_CYCLE", "alarmCode": 0,</code> | 续写当前表达式、集合或调用。 |
| 162 | <code>}, qos=0)</code> | 续写当前表达式、集合或调用。 |
| 167 | <code>beat_index = int(t // BEAT_SECONDS)</code> | 给 `beat_index` 赋值。 |
| 169 | <code>if now - last_status &gt;= 1.0:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 170 | <code>last_status = now</code> | 给 `last_status` 赋值。 |
| 171 | <code>ng = beat_index // 50  # 每 50 件出 1 件 NG</code> | 给 `ng` 赋值。 |
| 172 | <code>pub(client, T_STATUS, {</code> | 调用函数或对象方法并传入参数。 |
| 173 | <code>"ts": now_ms(), "lineId": LINE_ID, "state": "running",</code> | 续写当前表达式、集合或调用。 |
| 174 | <code>"productCode": "MOCK-P1",</code> | 续写当前表达式、集合或调用。 |
| 175 | <code>"goodCount": beat_index - ng, "ngCount": ng,</code> | 续写当前表达式、集合或调用。 |
| 176 | <code>"beatMs": int(BEAT_SECONDS * 1000),</code> | 续写当前表达式、集合或调用。 |
| 177 | <code>}, qos=1, retain=True)</code> | 续写当前表达式、集合或调用。 关键字：`True`＝布尔真值。 |
| 182 | <code>if beat_index != last_beat and t &gt;= 1:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`and`＝逻辑与。 |
| 183 | <code>last_beat = beat_index</code> | 给 `last_beat` 赋值。 |
| 184 | <code>seq += 1</code> | 续写当前表达式、集合或调用。 |
| 186 | <code>sn = f"SN{time.strftime('%Y%m%d')}{seq:05d}"</code> | 给 `sn` 赋值。 |
| 187 | <code>pub(client, T_EVENT, {</code> | 调用函数或对象方法并传入参数。 |
| 188 | <code>"ts": now_ms(), "lineId": LINE_ID, "deviceId": ROBOT_ID,</code> | 续写当前表达式、集合或调用。 |
| 189 | <code>"type": "piece_done", "level": "info",</code> | 续写当前表达式、集合或调用。 |
| 190 | <code>"message": f"工件 {sn} 完成",</code> | 续写当前表达式、集合或调用。 |
| 191 | <code>}, qos=1)</code> | 续写当前表达式、集合或调用。 |
| 195 | <code>if now &gt;= next_alarm:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 197 | <code>next_alarm = now + random.uniform(90, 180)</code> | 给 `next_alarm` 赋值。 |
| 198 | <code>pub(client, T_EVENT, {</code> | 调用函数或对象方法并传入参数。 |
| 199 | <code>"ts": now_ms(), "lineId": LINE_ID, "deviceId": "plc-01",</code> | 续写当前表达式、集合或调用。 |
| 200 | <code>"type": "alarm", "level": "warning",</code> | 续写当前表达式、集合或调用。 |
| 201 | <code>"code": "W201", "message": "气源压力偏低(mock)",</code> | 续写当前表达式、集合或调用。 |
| 202 | <code>}, qos=1)</code> | 续写当前表达式、集合或调用。 |
| 206 | <code>time.sleep(1.0 / ROBOT_HZ)</code> | 调用函数或对象方法并传入参数。 |
| 207 | <code>except KeyboardInterrupt:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常。 |
| 209 | <code>print("停止 mock collector")</code> | 调用函数或对象方法并传入参数。 |
| 215 | <code>if __name__ == "__main__":</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 217 | <code>main()</code> | 调用函数或对象方法并传入参数。 |
