# -*- coding: utf-8 -*-
"""
Mock 边缘采集器
================
模拟一条产线向 MQTT Broker 上报数据,用于现场到位前的全链路开发。
主题与报文格式严格遵守数据契约 docs/contract/README.md ——
到现场后用真实采集器(如 plc_collector.py)替换本文件,云端/前端/数据库零改动。

运行:  python edge/test/mock_collector.py
配置:  环境变量 MQTT_HOST / MQTT_PORT / MQTT_USERNAME / MQTT_PASSWORD / LINE_ID / ROBOT_ID
"""
# 这一段负责生成符合契约的模拟采集报文，为后续代码提供当前文件的处理入口。
import json
# 从 Python 环境 导入 json，供后续代码使用。
# json：来自 json，Python JSON 编解码库
import math
# 从 Python 环境 导入 math，供后续代码使用。
# math：来自 math，供本文件后续调用的对象
import os
# 从 Python 环境 导入 os，供后续代码使用。
# os：来自 os，Python 操作系统环境变量接口
import random
# 从 Python 环境 导入 random，供后续代码使用。
# random：来自 random，供本文件后续调用的对象
import time
# 从 Python 环境 导入 time，供后续代码使用。
# time：来自 time，Python 时间与暂停接口

import paho.mqtt.client as mqtt
# 从 Python 环境 导入 paho.mqtt.client as mqtt，供后续代码使用。
# mqtt：来自 paho.mqtt.client，Paho MQTT 客户端模块，用于发布上行帧并订阅下行指令

# MQTT Broker 的主机地址，默认本机。
MQTT_HOST = os.getenv("MQTT_HOST", "localhost")
# 读取操作系统环境变量，未设置时使用指定默认值，将结果保存或写入 MQTT_HOST。
# MQTT_HOST：保存 os.getenv('MQTT_HOST', 'localhost') 的结果；getenv：读取操作系统环境变量，未设置时使用指定默认值；os：Python 操作系统环境变量接口
# MQTT Broker 的端口。1883 = 明文；8883 = TLS 加密（生产用）
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
# 将输入转换为整数，供寄存器地址或状态编号计算，将结果保存或写入 MQTT_PORT。
# MQTT_PORT：保存 int(os.getenv('MQTT_PORT', '1883')) 的结果；getenv：读取操作系统环境变量，未设置时使用指定默认值；os：Python 操作系统环境变量接口
# 认证账号密码。os.getenv 默认 None；`or None` 把空字符串也归一成 None
# （None = 匿名登录，非 None = 用账号密码）
MQTT_USERNAME = os.getenv("MQTT_USERNAME") or None
# 读取操作系统环境变量，未设置时使用指定默认值，将结果保存或写入 MQTT_USERNAME。
# MQTT_USERNAME：保存 os.getenv('MQTT_USERNAME') or None 的结果；getenv：读取操作系统环境变量，未设置时使用指定默认值；os：Python 操作系统环境变量接口
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD") or None
# 读取操作系统环境变量，未设置时使用指定默认值，将结果保存或写入 MQTT_PASSWORD。
# MQTT_PASSWORD：保存 os.getenv('MQTT_PASSWORD') or None 的结果；getenv：读取操作系统环境变量，未设置时使用指定默认值；os：Python 操作系统环境变量接口
# 产线编码：必须与数据库 production_lines.code 一致（后端靠它把 code 翻译成主键）
LINE_ID = os.getenv("LINE_ID", "line-01")
# 读取操作系统环境变量，未设置时使用指定默认值，将结果保存或写入 LINE_ID。
# LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果；getenv：读取操作系统环境变量，未设置时使用指定默认值；os：Python 操作系统环境变量接口
# 机器人设备编码：必须与数据库 devices.code 一致
ROBOT_ID = os.getenv("ROBOT_ID", "robot-01")
# 读取操作系统环境变量，未设置时使用指定默认值，将结果保存或写入 ROBOT_ID。
# ROBOT_ID：保存 os.getenv('ROBOT_ID', 'robot-01') 的结果；getenv：读取操作系统环境变量，未设置时使用指定默认值；os：Python 操作系统环境变量接口

# 机器人六轴遥测主题（上行，10Hz）
T_ROBOT  = f"tl/v1/{LINE_ID}/telemetry/robot/{ROBOT_ID}"
# 根据 f"tl/v1/{LINE_ID}/telemetry/robot/{ROBOT_ID}" 设置 T_ROBOT，供当前流程后续使用。
# T_ROBOT：保存 f'tl/v1/{LINE_ID}/telemetry/robot/{ROBOT_ID}' 的结果；LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果；ROBOT_ID：保存 os.getenv('ROBOT_ID', 'robot-01') 的结果
# 产线状态主题（上行，1Hz，retained）
T_STATUS = f"tl/v1/{LINE_ID}/telemetry/status"
# 根据 f"tl/v1/{LINE_ID}/telemetry/status" 设置 T_STATUS，供当前流程后续使用。
# T_STATUS：保存 f'tl/v1/{LINE_ID}/telemetry/status' 的结果；LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果
# 生产事件主题（上行，事件触发）
T_EVENT  = f"tl/v1/{LINE_ID}/event"
# 根据 f"tl/v1/{LINE_ID}/event" 设置 T_EVENT，供当前流程后续使用。
# T_EVENT：保存 f'tl/v1/{LINE_ID}/event' 的结果；LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果
# 边缘在线状态主题（上行，retained + LWT）
T_EDGE   = f"tl/v1/{LINE_ID}/edge/status"
# 根据 f"tl/v1/{LINE_ID}/edge/status" 设置 T_EDGE，供当前流程后续使用。
# T_EDGE：保存 f'tl/v1/{LINE_ID}/edge/status' 的结果；LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果
# ★ 控制指令主题（下行，我们订阅它）。末尾的 + 是 MQTT 单层通配符，
#   意思是"这条产线下所有设备的指令我都收"
T_CMD    = f"tl/v1/{LINE_ID}/cmd/+"
# 根据 f"tl/v1/{LINE_ID}/cmd/+" 设置 T_CMD，供当前流程后续使用。
# T_CMD：保存 f'tl/v1/{LINE_ID}/cmd/+' 的结果；LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果
# 指令回执主题（上行）
T_ACK    = f"tl/v1/{LINE_ID}/cmd_ack"
# 根据 f"tl/v1/{LINE_ID}/cmd_ack" 设置 T_ACK，供当前流程后续使用。
# T_ACK：保存 f'tl/v1/{LINE_ID}/cmd_ack' 的结果；LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果

# 模拟节拍：每 8.5 秒出一件（真实节拍由 PLC 决定）
BEAT_SECONDS = 8.5   # 模拟节拍:每 8.5s 出一件
# 根据 8.5 # 模拟节拍:每 8.5s 出一件 设置 BEAT_SECONDS，供当前流程后续使用。
# BEAT_SECONDS：保存 8.5 的结果
# 机器人关节数据发布频率（Hz）
ROBOT_HZ = 10        # 关节数据发布频率
# 根据 10 # 关节数据发布频率 设置 ROBOT_HZ，供当前流程后续使用。
# ROBOT_HZ：保存 10 的结果


# 这一段定义 now_ms，用于生成当前毫秒时间戳，作为上行报文的产生时间。
def now_ms() -> int:
# 定义 now_ms，用于生成当前毫秒时间戳，作为上行报文的产生时间。
# now_ms：生成当前毫秒时间戳，作为上行报文的产生时间
    return int(time.time() * 1000)
    # 把int(time.time() * 1000)作为当前函数的结果返回。
    # time：Python 时间与暂停接口
    # 这一段实现了生成当前毫秒时间戳，作为上行报文的产生时间；返回值或异常由调用方按当前分支处理。


# 这一段定义 pub，用于将模拟报文编码为 JSON 并发布到 MQTT。
def pub(client, topic, obj, qos=0, retain=False):
# 定义 pub，用于将模拟报文编码为 JSON 并发布到 MQTT。
# pub：将模拟报文编码为 JSON 并发布到 MQTT；client：方法输入参数；topic：MQTT 发布或订阅使用的主题路径；obj：方法输入参数；qos：MQTT 消息投递质量等级，本次传入 0；retain：MQTT 是否保留主题的最后一条消息，本次传入 False
    # ensure_ascii=False → 中文不转义（否则看到的是 \uXXXX）
    client.publish(topic, json.dumps(obj, ensure_ascii=False), qos=qos, retain=retain)
    # 把消息发布到指定主题或频道。
    # publish：向 MQTT 主题或 Redis 频道发布消息，以客户端类型为准；topic：MQTT 发布或订阅使用的主题路径；qos：MQTT 消息投递质量等级，本次传入 qos；retain：MQTT 是否保留主题的最后一条消息，本次传入 retain；client：方法输入参数；dumps：把 Python 对象编码成 JSON 文本；obj：方法输入参数；json：Python JSON 编解码库
    # 这一段实现了将模拟报文编码为 JSON 并发布到 MQTT；返回值或异常由调用方按当前分支处理。


# 这一段定义 on_message，用于处理模拟采集器收到的下行指令并回送模拟回执。
def on_message(client, userdata, msg):
# 定义函数 on_message。
# on_message：处理模拟采集器收到的下行指令并回送模拟回执；client：方法输入参数；userdata：方法输入参数；msg：当前收到的消息或提示文字
    """控制指令 mock:收到指令 0.3s 后回 ack(模拟 PLC 已执行)。
    真实采集器中,这里替换为"写 PLC 寄存器 → 等待 PLC 反馈"。"""
    try:
    # 开始执行可能失败的操作，错误由后续异常分支处理。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        # 解析指令 JSON
        cmd = json.loads(msg.payload.decode("utf-8"))
        # 把 JSON 文本解码成 Python 对象，将结果保存或写入 cmd。
        # cmd：保存 json.loads(msg.payload.decode('utf-8')) 的结果；loads：把 JSON 文本解码成 Python 对象；json：Python JSON 编解码库；decode：把字节序列解码成字符串；payload：消息或事件携带的数据内容；msg：当前收到的消息或提示文字
        # 打印收到的指令（联调时肉眼可见）
        print(f"[cmd] 收到指令 type={cmd.get('type')} topic={msg.topic}")
        # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
        # topic：MQTT 发布或订阅使用的主题路径，本次传入 {msg.topic}"；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；msg：当前收到的消息或提示文字；cmd：保存 json.loads(msg.payload.decode('utf-8')) 的结果
        # 模拟 PLC 执行耗时（真实场景是等 PLC 写完寄存器再反馈）
        time.sleep(0.3)
        # 暂停当前线程指定秒数。
        # sleep：暂停当前线程指定秒数；time：Python 时间与暂停接口
        # 回执：cmdId 必须原样带回，后端靠它更新 control_commands 的状态
        pub(client, T_ACK, {
        # 把消息发布到指定主题或频道。
        # pub：将模拟报文编码为 JSON 并发布到 MQTT；client：方法输入参数；T_ACK：保存 f'tl/v1/{LINE_ID}/cmd_ack' 的结果
            "ts": now_ms(),
            # 在当前模拟输入或配置映射中，将键 ts 设为 now_ms()。
            # ts 是当前映射表的查找键；now_ms() 是用该键读取时取得的值
            "cmdId": cmd.get("cmdId"),
            # 在当前模拟输入或配置映射中，将键 cmdId 设为 cmd.get("cmdId")。
            # cmdId 是当前映射表的查找键；cmd.get("cmdId") 是用该键读取时取得的值
            "status": "acked",
            # 在当前模拟输入或配置映射中，将键 status 设为 "acked"。
            # status 是当前映射表的查找键；"acked" 是用该键读取时取得的值
            "message": "mock 已执行",
            # 在当前模拟输入或配置映射中，将键 message 设为 "mock 已执行"。
            # message 是当前映射表的查找键；"mock 已执行" 是用该键读取时取得的值
        }, qos=1)
        # 结束当前对象、函数或条件代码块，供当前处理流程继续使用。
        # qos：MQTT 消息投递质量等级，本次传入 1
    except Exception as exc:  # mock 阶段宽容处理,不让异常打断主循环
    # 接收并处理上一段操作产生的异常。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        # 真实采集器里这里应该：记录日志 + 回 failed 回执
        print(f"[cmd] 处理失败: {exc}")
        # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        # 这一段实现了处理模拟采集器收到的下行指令并回送模拟回执；返回值或异常由调用方按当前分支处理。


# 这一段定义 main，用于连接 MQTT 并循环生成模拟遥测、状态与事件数据。
def main():
# 定义 main，用于连接 MQTT 并循环生成模拟遥测、状态与事件数据。
# main：本文件定义的函数，用于运行  的入口流程
    # ---- 1. 创建 MQTT 客户端 ----
    # CallbackAPIVersion.VERSION2 = paho 2.x 的回调签名规范
    # client_id 必须唯一（同一时刻两个客户端用同一个 ID，Broker 会踢掉前一个）
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2,
    # 创建 MQTT 客户端，用于连接消息代理并收发采集报文，将结果保存或写入 client。
    # client：保存 mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f'edge-mock-{L… 的结果；mqtt：Paho MQTT 客户端模块，用于发布上行帧并订阅下行指令
                         client_id=f"edge-mock-{LINE_ID}")
                         # 根据 f"edge-mock-{LINE_ID}") 设置 client_id，供当前流程后续使用。
                         # LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果
    # ---- 2. 配置认证 ----
    if MQTT_USERNAME:
    # 检查MQTT_USERNAME:，按判断结果进入对应的处理分支。
    # MQTT_USERNAME：保存 os.getenv('MQTT_USERNAME') or None 的结果
        client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
        # 设置 MQTT 登录用户名和密码。
        # username_pw_set：设置 MQTT 登录用户名和密码；MQTT_USERNAME：保存 os.getenv('MQTT_USERNAME') or None 的结果；MQTT_PASSWORD：保存 os.getenv('MQTT_PASSWORD') or None 的结果；client：保存 mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f'edge-mock-{L… 的结果
    # LWT:异常掉线时 Broker 自动发布 retained offline —— 产线离线状态由此而来
    # ---- 3. 设置遗嘱消息（LWT）----
    # LWT:异常掉线时 Broker 自动发布 retained offline —— 产线离线状态由此而来
    # 原理：我们告诉 Broker"如果我异常消失了，帮我发这条消息"。
    #       Broker 会在客户端**非正常断开**时（心跳超时/网络断开）自动发布。
    #       正常关闭连接时（client.disconnect()）不会发遗嘱 —— 所以正常下线
    #       时我们要自己发一条 offline（见 main 函数末尾的说明）。
    client.will_set(
    # 配置 MQTT 断线遗嘱消息。
    # client：保存 mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f'edge-mock-{L… 的结果；will_set：配置 MQTT 断线遗嘱消息
        T_EDGE,
        # 把变量 T_EDGE 作为同名对象字段加入当前对象。
        # T_EDGE：保存 f'tl/v1/{LINE_ID}/edge/status' 的结果
        json.dumps({"ts": now_ms(), "lineId": LINE_ID, "status": "offline"}),
        # 把 Python 对象编码成 JSON 文本。
        # dumps：把 Python 对象编码成 JSON 文本；json：Python JSON 编解码库；LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果；now_ms：生成当前毫秒时间戳，作为上行报文的产生时间
        qos=1, retain=True,
        # 根据 1, retain=True, 设置 qos，用于MQTT 消息投递质量等级。
        # qos：MQTT 消息投递质量等级；retain：MQTT 是否保留主题的最后一条消息，本次传入 True
    )
    # 结束当前函数、分支或对象配置，返回上一层处理流程。
    # 本行结束上面最近一层已经介绍的表达式或代码块
    # ---- 4. 注册消息回调 ----
    # 收到下行指令时会调用 on_message
    client.on_message = on_message
    # 把 on_message 的结果赋给 client.on_message。
    # on_message：处理模拟采集器收到的下行指令并回送模拟回执；client：保存 on_message 的结果
    # ---- 5. 建立连接 ----
    # connect 是阻塞的（会做 TCP 连接 + MQTT CONNECT/SUBACK 握手）
    client.connect(MQTT_HOST, MQTT_PORT, keepalive=30)
    # 尝试建立网络连接。
    # connect：尝试建立网络连接；MQTT_HOST：保存 os.getenv('MQTT_HOST', 'localhost') 的结果；MQTT_PORT：保存 int(os.getenv('MQTT_PORT', '1883')) 的结果；client：保存 on_message 的结果
    # ---- 6. 订阅下行指令主题 ----
    # QoS1：指令不能丢
    client.subscribe(T_CMD, qos=1)
    # 订阅消息主题、频道或事件流。
    # subscribe：订阅消息主题、频道或事件流；T_CMD：保存 f'tl/v1/{LINE_ID}/cmd/+' 的结果；qos：MQTT 消息投递质量等级，本次传入 1；client：保存 on_message 的结果
    # ---- 7. 启动网络线程 ----
    # paho 的收发循环跑在后台线程里。不调用 loop_start() 就没有网络收发能力。
    client.loop_start()
    # 启动 Paho MQTT 后台网络线程。
    # loop_start：启动 Paho MQTT 后台网络线程；client：保存 on_message 的结果

    # ---- 8. 发布"边缘在线"（retained）----
    # 因为是 retained，后端**任何时候**订阅都能立刻拿到这条 online。
    # 这就实现了"后端晚启动也能立刻知道边缘在线"。
    pub(client, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "online"},
    # 把消息发布到指定主题或频道。
    # pub：将模拟报文编码为 JSON 并发布到 MQTT；client：保存 on_message 的结果；T_EDGE：保存 f'tl/v1/{LINE_ID}/edge/status' 的结果；ts：数据产生时的毫秒时间戳；now_ms：生成当前毫秒时间戳，作为上行报文的产生时间；lineId：产线标识，接口通常使用 line-01 等编码；LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果；status：当前连接、产线、请求或指令的状态字段
        qos=1, retain=True)
        # 根据 1, retain=True) 设置 qos，用于MQTT 消息投递质量等级。
        # qos：MQTT 消息投递质量等级；retain：MQTT 是否保留主题的最后一条消息，本次传入 True
    # ---- 9. 发布一条"产线启动"事件（让页面的事件流一开始就有内容）----
    pub(client, T_EVENT, {"ts": now_ms(), "lineId": LINE_ID, "deviceId": "plc-01",
    # 把消息发布到指定主题或频道。
    # pub：将模拟报文编码为 JSON 并发布到 MQTT；client：保存 on_message 的结果；T_EVENT：保存 f'tl/v1/{LINE_ID}/event' 的结果；ts：数据产生时的毫秒时间戳；now_ms：生成当前毫秒时间戳，作为上行报文的产生时间；lineId：产线标识，接口通常使用 line-01 等编码；LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果；deviceId：设备标识，接口使用配置中的设备编码
                          "type": "start", "level": "info",
                          # 在当前模拟输入或配置映射中，将键 type 设为 "start"。
                          # type 是当前映射表的查找键；"start" 是用该键读取时取得的值
                          "message": "产线启动(mock)"}, qos=1)
                          # 在当前模拟输入或配置映射中，将键 message 设为 "产线启动(mock)"}。
                          # message 是当前映射表的查找键；"产线启动(mock)"} 是用该键读取时取得的值

    # 六轴仿真参数:基值 + 幅值 * sin,各轴频率不同,运动看起来更自然
    # ---- 10. 六轴仿真参数 ----
    # 每个关节用「基值 + 幅值 * sin(2π * 频率 * t)」生成。
    # 各轴频率不同 → 运动看起来更自然（真实机械臂各关节节奏本来就不同）。
    base = [0.0, -30.0, 45.0, 0.0, 60.0, 0.0]
    # 根据 [0.0, -30.0, 45.0, 0.0, 60.0, 0.0] 设置 base，供当前流程后续使用。
    # base：保存 [0.0, -30.0, 45.0, 0.0, 60.0, 0.0] 的结果
    amp  = [60.0, 20.0, 25.0, 45.0, 30.0, 90.0]
    # 根据 [60.0, 20.0, 25.0, 45.0, 30.0, 90.0] 设置 amp，供当前流程后续使用。
    # amp：保存 [60.0, 20.0, 25.0, 45.0, 30.0, 90.0] 的结果
    freq = [0.10, 0.13, 0.11, 0.07, 0.09, 0.15]
    # 根据 [0.10, 0.13, 0.11, 0.07, 0.09, 0.15] 设置 freq，供当前流程后续使用。
    # freq：保存 [0.1, 0.13, 0.11, 0.07, 0.09, 0.15] 的结果

    # ---- 11. 循环状态变量 ----
    t0 = time.time()
    # 读取当前 Unix 时间，供采集间隔与消息时间戳计算，将结果保存或写入 t0。
    # t0：保存 time.time() 的结果；time：Python 时间与暂停接口
    last_status = 0.0
    # 根据 0.0 设置 last_status，供当前流程后续使用。
    # last_status：保存 0.0 的结果
    last_beat = -1
    # 根据 -1 设置 last_beat，供当前流程后续使用。
    # last_beat：保存 -1 的结果
    seq = 0
    # 根据 0 设置 seq，供当前流程后续使用。
    # seq：保存 0 的结果
    next_alarm = t0 + random.uniform(90, 180)
    # 在给定上下界之间取随机时间间隔，安排下一次模拟事件，将结果保存或写入 next_alarm。
    # next_alarm：保存 t0 + random.uniform(90, 180) 的结果；t0：保存 time.time() 的结果；random：从 random 导入的模块，类型为 random

    # 启动提示
    print(f"mock collector 已启动  broker={MQTT_HOST}:{MQTT_PORT}  line={LINE_ID}")
    # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
    # MQTT_HOST：保存 os.getenv('MQTT_HOST', 'localhost') 的结果；MQTT_PORT：保存 int(os.getenv('MQTT_PORT', '1883')) 的结果；LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果
    try:
    # 开始执行可能失败的操作，错误由后续异常分支处理。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        # ---- 12. 主循环：按 ROBOT_HZ 频率发布数据 ----
        while True:
        # 持续检查True:，按判断结果进入对应的处理分支。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
            t = time.time() - t0
            # 读取当前 Unix 时间，供采集间隔与消息时间戳计算，将结果保存或写入 t。
            # t：保存 time.time() - t0 的结果；t0：保存 time.time() 的结果；time：Python 时间与暂停接口
            now = time.time()
            # 读取当前 Unix 时间，供采集间隔与消息时间戳计算，将结果保存或写入 now。
            # now：取得当前时间戳；Date.now 使用毫秒；time：Python 时间与暂停接口

            # 1) 机器人六轴遥测 @10Hz
            # ========== ① 机器人六轴遥测 @10Hz ==========
            # 用 zip 同时遍历 base/amp/freq，生成 6 个关节角
            joints = [round(b + a * math.sin(2 * math.pi * f * t), 3)
            # 按要求的精度对数值四舍五入，将结果保存或写入 joints。
            # joints：按 J1 到 J6 排列的六个关节角度，遥测契约中单位为度；math：从 math 导入的模块，类型为 math；t：保存 time.time() - t0 的结果
                      for b, a, f in zip(base, amp, freq)]
                      # 循环处理b, a, f in zip(base, amp, freq)]，按判断结果进入对应的处理分支。
                      # base：保存 [0.0, -30.0, 45.0, 0.0, 60.0, 0.0] 的结果；amp：保存 [60.0, 20.0, 25.0, 45.0, 30.0, 90.0] 的结果；freq：保存 [0.1, 0.13, 0.11, 0.07, 0.09, 0.15] 的结果
            pub(client, T_ROBOT, {
            # 把消息发布到指定主题或频道。
            # pub：将模拟报文编码为 JSON 并发布到 MQTT；client：保存 on_message 的结果；T_ROBOT：保存 f'tl/v1/{LINE_ID}/telemetry/robot/{ROBOT_ID}' 的结果
                "ts": now_ms(), "deviceId": ROBOT_ID,
                # 在当前模拟输入或配置映射中，将键 ts 设为 now_ms()。
                # ts 是当前映射表的查找键；now_ms() 是用该键读取时取得的值
                "joints": joints,
                # 在当前模拟输入或配置映射中，将键 joints 设为 joints。
                # joints 是当前映射表的查找键；joints 是用该键读取时取得的值
                "tcp": None,  # mock 不做运动学正解;现场若 PLC 提供则填实际值
                # 在当前模拟输入或配置映射中，将键 tcp 设为 None。
                # tcp 是当前映射表的查找键；None 是用该键读取时取得的值
                "speedPct": 80, "mode": "auto",
                # 在当前模拟输入或配置映射中，将键 speedPct 设为 80。
                # speedPct 是当前映射表的查找键；80 是用该键读取时取得的值
                "program": "MOCK_CYCLE", "alarmCode": 0,
                # 在当前模拟输入或配置映射中，将键 program 设为 "MOCK_CYCLE"。
                # program 是当前映射表的查找键；"MOCK_CYCLE" 是用该键读取时取得的值
            }, qos=0)
            # 结束当前对象、函数或条件代码块，供当前处理流程继续使用。
            # qos：MQTT 消息投递质量等级，本次传入 0

            # 2) 产线状态快照 @1Hz(retained)
            # ========== ② 产线状态快照 @1Hz(retained) ==========
            # beat_index = 已经过了多少个节拍周期（整数）
            beat_index = int(t // BEAT_SECONDS)
            # 将输入转换为整数，供寄存器地址或状态编号计算，将结果保存或写入 beat_index。
            # beat_index：保存 int(t // BEAT_SECONDS) 的结果；t：保存 time.time() - t0 的结果；BEAT_SECONDS：保存 8.5 的结果
            # 每秒最多发一次
            if now - last_status >= 1.0:
            # 检查now - last_status >= 1.0:，按判断结果进入对应的处理分支。
            # now：取得当前时间戳；Date.now 使用毫秒；last_status：保存 0.0 的结果
                last_status = now
                # 根据 now 设置 last_status，供当前流程后续使用。
                # last_status：保存 now 的结果；now：取得当前时间戳；Date.now 使用毫秒
                ng = beat_index // 50  # 每 50 件出 1 件 NG
                # 根据 beat_index // 50 # 每 50 件出 1 件 NG 设置 ng，供当前流程后续使用。
                # ng：保存 beat_index // 50 的结果；beat_index：保存 int(t // BEAT_SECONDS) 的结果
                pub(client, T_STATUS, {
                # 把消息发布到指定主题或频道。
                # pub：将模拟报文编码为 JSON 并发布到 MQTT；client：保存 on_message 的结果；T_STATUS：保存 f'tl/v1/{LINE_ID}/telemetry/status' 的结果
                    "ts": now_ms(), "lineId": LINE_ID, "state": "running",
                    # 在当前模拟输入或配置映射中，将键 ts 设为 now_ms()。
                    # ts 是当前映射表的查找键；now_ms() 是用该键读取时取得的值
                    "productCode": "MOCK-P1",
                    # 在当前模拟输入或配置映射中，将键 productCode 设为 "MOCK-P1"。
                    # productCode 是当前映射表的查找键；"MOCK-P1" 是用该键读取时取得的值
                    "goodCount": beat_index - ng, "ngCount": ng,
                    # 在当前模拟输入或配置映射中，将键 goodCount 设为 beat_index - ng。
                    # goodCount 是当前映射表的查找键；beat_index - ng 是用该键读取时取得的值
                    "beatMs": int(BEAT_SECONDS * 1000),
                    # 在当前模拟输入或配置映射中，将键 beatMs 设为 int(BEAT_SECONDS * 1000)。
                    # beatMs 是当前映射表的查找键；int(BEAT_SECONDS * 1000) 是用该键读取时取得的值
                }, qos=1, retain=True)
                # 结束当前对象、函数或条件代码块，供当前处理流程继续使用。
                # qos：MQTT 消息投递质量等级，本次传入 1；retain：MQTT 是否保留主题的最后一条消息，本次传入 True

            # 3) 每件一次:piece_done 事件
            # ========== ③ 每件一次:单件完成事件 ==========
            # 节拍序号变了 → 说明又出了一件
            if beat_index != last_beat and t >= 1:
            # 检查beat_index != last_beat and t >= 1:，按判断结果进入对应的处理分支。
            # beat_index：保存 int(t // BEAT_SECONDS) 的结果；last_beat：保存 -1 的结果；t：保存 time.time() - t0 的结果
                last_beat = beat_index
                # 根据 beat_index 设置 last_beat，供当前流程后续使用。
                # last_beat：保存 beat_index 的结果；beat_index：保存 int(t // BEAT_SECONDS) 的结果
                seq += 1
                # 用 1 更新 seq；+= 表示先计算再赋回。
                # seq：保存 0 的结果
                # 工件序列号：SN + 日期 + 5 位序号
                sn = f"SN{time.strftime('%Y%m%d')}{seq:05d}"
                # 根据 f"SN{time.strftime('%Y%m%d')}{seq:05d}" 设置 sn，供当前流程后续使用。
                # sn：保存 f"SN{time.strftime('%Y%m%d')}{seq:05d}" 的结果；seq：保存 0 的结果；time：Python 时间与暂停接口
                pub(client, T_EVENT, {
                # 把消息发布到指定主题或频道。
                # pub：将模拟报文编码为 JSON 并发布到 MQTT；client：保存 on_message 的结果；T_EVENT：保存 f'tl/v1/{LINE_ID}/event' 的结果
                    "ts": now_ms(), "lineId": LINE_ID, "deviceId": ROBOT_ID,
                    # 在当前模拟输入或配置映射中，将键 ts 设为 now_ms()。
                    # ts 是当前映射表的查找键；now_ms() 是用该键读取时取得的值
                    "type": "piece_done", "level": "info",
                    # 在当前模拟输入或配置映射中，将键 type 设为 "piece_done"。
                    # type 是当前映射表的查找键；"piece_done" 是用该键读取时取得的值
                    "message": f"工件 {sn} 完成",
                    # 在当前模拟输入或配置映射中，将键 message 设为 f"工件 {sn} 完成"。
                    # message 是当前映射表的查找键；f"工件 {sn} 完成" 是用该键读取时取得的值
                }, qos=1)
                # 结束当前对象、函数或条件代码块，供当前处理流程继续使用。
                # qos：MQTT 消息投递质量等级，本次传入 1

            # 4) 偶发告警(90~180s 随机)
            # ========== ④ 偶发告警(90~180s 随机) ==========
            if now >= next_alarm:
            # 检查now >= next_alarm:，按判断结果进入对应的处理分支。
            # now：取得当前时间戳；Date.now 使用毫秒；next_alarm：保存 t0 + random.uniform(90, 180) 的结果
                # 排下一次报警时间
                next_alarm = now + random.uniform(90, 180)
                # 在给定上下界之间取随机时间间隔，安排下一次模拟事件，将结果保存或写入 next_alarm。
                # next_alarm：保存 now + random.uniform(90, 180) 的结果；now：取得当前时间戳；Date.now 使用毫秒；random：从 random 导入的模块，类型为 random
                pub(client, T_EVENT, {
                # 把消息发布到指定主题或频道。
                # pub：将模拟报文编码为 JSON 并发布到 MQTT；client：保存 on_message 的结果；T_EVENT：保存 f'tl/v1/{LINE_ID}/event' 的结果
                    "ts": now_ms(), "lineId": LINE_ID, "deviceId": "plc-01",
                    # 在当前模拟输入或配置映射中，将键 ts 设为 now_ms()。
                    # ts 是当前映射表的查找键；now_ms() 是用该键读取时取得的值
                    "type": "alarm", "level": "warning",
                    # 在当前模拟输入或配置映射中，将键 type 设为 "alarm"。
                    # type 是当前映射表的查找键；"alarm" 是用该键读取时取得的值
                    "code": "W201", "message": "气源压力偏低(mock)",
                    # 在当前模拟输入或配置映射中，将键 code 设为 "W201"。
                    # code 是当前映射表的查找键；"W201" 是用该键读取时取得的值
                }, qos=1)
                # 结束当前对象、函数或条件代码块，供当前处理流程继续使用。
                # qos：MQTT 消息投递质量等级，本次传入 1

            # ========== ⑤ 控制循环节奏 ==========
            # sleep(1/ROBOT_HZ) = 0.1 秒 → 每秒 10 次循环 → 10Hz
            time.sleep(1.0 / ROBOT_HZ)
            # 暂停当前线程指定秒数。
            # sleep：暂停当前线程指定秒数；time：Python 时间与暂停接口；ROBOT_HZ：保存 10 的结果
    except KeyboardInterrupt:
    # 接收并处理上一段操作产生的异常。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        # Ctrl+C 退出
        print("停止 mock collector")
        # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        # 这一段实现了连接 MQTT 并循环生成模拟遥测、状态与事件数据；返回值或异常由调用方按当前分支处理。


# ---------------------------------------------------------------------------
# 六、程序入口
# ---------------------------------------------------------------------------
if __name__ == "__main__":
# 检查__name__ == "__main__":，按判断结果进入对应的处理分支。
# 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    # 只有直接运行本文件时才执行 main()（被 import 时不执行）
    main()
    # 执行 main 对应的本地处理，使用本行提供的数据。
    # main：本文件定义的函数，用于运行  的入口流程
    # 这一段提供了生成符合契约的模拟采集报文所需的定义和处理逻辑，结果交由调用方或运行环境使用。
