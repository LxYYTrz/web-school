"""控制命令 dispatch 单元测试(不连真实 PLC,纯本地)

跑法:  cd edge && python _test_cmd.py

测什么:
  1. register-mapping.csv 加载: cmd.* 进 _cmd_signals(写),其余进 sigs(读)
  2. CMD_DISPATCH 覆盖契约 v1.2 全部 7 个 type
  3. 现场只有 4 个可执行指令;reset/changeover/alarm_clear
     必须 rejected(不能假装 acked —— 否则操作员以为生效了)
  4. 真连 PLC: 所有写点都**只写一次**(2026-10-16 现场确认 PLC 侧自行清零脉冲点,
     采集器不再 sleep 后回写 0)
  5. mode_set / conveyor 的 action 枚举校验(合法值通过,非法值 rejected)
  6. 未知 type
  7. PLC 通信异常 → rejected

点位依据:DB3-Modbus-映射表.xls(2026-10-16)
  word 7  停止信号       写 1,PLC 完成后自动置 0
  word 8  手动模式切换   1=获取 2=释放,PLC 切换完成后自动置 0
  word 9  启动信号       写 1,PLC 完成后自动置 0
  word 10 传送带控制     电平,1=正转 0=停止
"""
# 这一段负责验证现场指令分派、缺失连接拒绝和通信互斥逻辑，为后续代码提供当前文件的处理入口。
import sys
# 从 Python 环境 导入 sys，供后续代码使用。
# sys：来自 sys，Python 运行环境与退出状态接口
import threading
# 从 Python 环境 导入 threading，供后续代码使用。
# threading：来自 threading，Python 线程与锁接口
import time as _time
# 从 Python 环境 导入 time as _time，供后续代码使用。
# _time：来自 time，Python 时间戳、计时和暂停标准库
from pathlib import Path
# 从 pathlib 导入 Path，供后续代码使用。
# Path：来自 pathlib，pathlib 的文件路径类

sys.path.insert(0, str(Path(__file__).parent))
# 将本行提供的值插入列表或搜索路径的指定位置。
# sys：Python 运行环境与退出状态接口；Path：pathlib 的文件路径类

import plc_collector
# 从 Python 环境 导入 plc_collector，供后续代码使用。
# plc_collector：来自 plc_collector，供本文件后续调用的对象
from plc_collector import (
# 从 plc_collector 导入 (，供后续代码使用。
# Plc：来自 plc_collector，本文件封装的 PLC 客户端，负责串行读写、重连和通信状态管理；_read_csv：来自 plc_collector，供本文件后续调用的对象；_cmd_signals：来自 plc_collector，供本文件后续调用的对象；_dispatch_cmd：来自 plc_collector，供本文件后续调用的对象；CMD_DISPATCH：来自 plc_collector，供本文件后续调用的对象；MODE_TOGGLE_VALUE：来自 plc_collector，供本文件后续调用的对象；CONVEYOR_VALUE：来自 plc_collector，供本文件后续调用的对象
    Plc, _read_csv, _cmd_signals, _dispatch_cmd,
    # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
    # Plc：本文件封装的 PLC 客户端，负责串行读写、重连和通信状态管理；_read_csv：读取点位映射表，将可读信号与控制写点分开保存；_cmd_signals：从 plc_collector 导入的对象，类型为 plc_collector；_dispatch_cmd：按契约和现场写点分派控制指令，拒绝不支持的动作
    CMD_DISPATCH, MODE_TOGGLE_VALUE, CONVEYOR_VALUE,
    # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
    # CMD_DISPATCH：从 plc_collector 导入的对象，类型为 plc_collector；MODE_TOGGLE_VALUE：从 plc_collector 导入的对象，类型为 plc_collector；CONVEYOR_VALUE：从 plc_collector 导入的对象，类型为 plc_collector
)
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 本行结束上面最近一层已经介绍的表达式或代码块

MAPPING = Path(__file__).with_name("register-mapping.csv")
# 将字符串或父路径构造成可操作的文件路径对象，将结果保存或写入 MAPPING。
# MAPPING：保存 Path(__file__).with_name('register-mapping.csv') 的结果；with_name：保留父目录，仅替换路径中的文件名；Path：pathlib 的文件路径类

# 现场 PLC 没有寄存器的指令 → 必须 rejected
NO_PLC_POINT = ("reset", "changeover", "alarm_clear")
# 根据 ("reset", "changeover", "alarm_clear") 设置 NO_PLC_POINT，供当前流程后续使用。
# NO_PLC_POINT：保存 ('reset', 'changeover', 'alarm_clear') 的结果


class _FakePlc:
# 定义 _FakePlc，约束或实现本模块涉及的数据和行为。
# 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    """模拟 Plc:暴露 _dispatch_cmd 需要的最小接口(.connected / .unit / .cli.write_register)"""

    # 这一段定义 __init__，用于初始化 _test_cmd 使用的实例状态和依赖。
    def __init__(self, connected: bool = True, raise_exc: bool = False):
    # 定义 __init__，用于初始化 _test_cmd 使用的实例状态和依赖。
    # __init__：本文件定义的函数，用于初始化  使用的实例状态和依赖；connected：连接是否已建立的状态标记；raise_exc：方法输入参数，类型为 bool
        self.connected = connected
        # 把 connected 的结果赋给 self.connected。
        # connected：连接是否已建立的状态标记，本次传入 connected
        self.lock = threading.Lock()
        # 把 threading.Lock() 的结果赋给 self.lock。
        # threading：Python 线程与锁接口
        self.unit = 2
        # 把 2 的结果赋给 self.unit。
        # unit：设备站号或点位物理单位，依据所在对象区分，本次传入 2
        self.writes: list[tuple[int, int, int]] = []
        # 把 [] 的结果赋给 self.writes: list[tuple[int, int, int]]。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        self._raise = raise_exc
        # 把 raise_exc 的结果赋给 self._raise。
        # raise_exc：方法输入参数，类型为 bool
        outer = self
        # 根据 self 设置 outer，供当前流程后续使用。
        # outer：保存 self 的结果

        class _Rr:
        # 定义 _Rr，约束或实现本模块涉及的数据和行为。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
            # 这一段定义 __init__，用于初始化 _test_cmd 使用的实例状态和依赖。
            def __init__(self, err=False):
            # 定义 __init__，用于初始化 _test_cmd 使用的实例状态和依赖。
            # __init__：本文件定义的函数，用于初始化  使用的实例状态和依赖；err：方法输入参数
                self._e = err
                # 把 err 的结果赋给 self._e。
                # err：方法输入参数
                # 这一段实现了初始化 _test_cmd 使用的实例状态和依赖；返回值或异常由调用方按当前分支处理。

            # 这一段定义 isError，用于返回模拟 Modbus 响应的错误标记，供测试失败分支。
            def isError(self):
            # 定义 isError，用于返回模拟 Modbus 响应的错误标记，供测试失败分支。
            # isError：判断 Modbus 响应是否携带协议错误
                return self._e
                # 把self._e作为当前函数的结果返回。
                # 返回值或异常使用上方流程得到的数据，由当前函数的调用方处理
                # 这一段实现了返回模拟 Modbus 响应的错误标记，供测试失败分支；返回值或异常由调用方按当前分支处理。

        class _Cli:
        # 定义 _Cli，约束或实现本模块涉及的数据和行为。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
            # 这一段定义 write_register，用于模拟写寄存器接口，记录调用或产生指定测试结果。
            def write_register(_self, address, value, device_id):
            # 定义函数 write_register。
            # write_register：向一个 Modbus 保持寄存器写入指定值，返回写入响应；_self：方法输入参数；address：Modbus 寄存器起始地址，使用从 0 开始的编号；value：当前字段或点位的实际取值；device_id：pymodbus 当前接口的目标设备站号参数
                assert outer.lock.locked(), 'PLC 写操作必须持有连接锁'
                # 执行 locked 对应的本地处理，使用本行提供的数据。
                # outer：保存 self 的结果
                if outer._raise:
                # 检查outer._raise:，按判断结果进入对应的处理分支。
                # outer：保存 self 的结果
                    raise RuntimeError("mock PLC 故障")
                    # 按本行指定的错误类型或信息终止当前处理并交给上层处理。
                    # 返回值或异常使用上方流程得到的数据，由当前函数的调用方处理
                outer.writes.append((address, value, device_id))
                # 把一个元素追加到 Python 列表末尾。
                # append：把一个元素追加到 Python 列表末尾；address：Modbus 寄存器起始地址，使用从 0 开始的编号；value：当前字段或点位的实际取值；device_id：pymodbus 当前接口的目标设备站号参数；outer：保存 self 的结果
                return _Rr()
                # 把_Rr()作为当前函数的结果返回。
                # 返回值或异常使用上方流程得到的数据，由当前函数的调用方处理
                # 这一段实现了模拟写寄存器接口，记录调用或产生指定测试结果；返回值或异常由调用方按当前分支处理。

        self.cli = _Cli()
        # 把 _Cli() 的结果赋给 self.cli。
        # cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求，本次传入 _Cli(
        # 这一段实现了初始化 _test_cmd 使用的实例状态和依赖；返回值或异常由调用方按当前分支处理。


# 这一段定义 main，用于用模拟客户端检查指令分派、拒绝路径和读写互斥行为。
def main() -> int:
# 定义 main，用于用模拟客户端检查指令分派、拒绝路径和读写互斥行为。
# main：本文件定义的函数，用于运行  的入口流程
    sigs = _read_csv(MAPPING)
    # 读取点位映射表，将可读信号与控制写点分开保存，将结果保存或写入 sigs。
    # sigs：保存 _read_csv(MAPPING) 的结果；_read_csv：读取点位映射表，将可读信号与控制写点分开保存；MAPPING：保存 Path(__file__).with_name('register-mapping.csv') 的结果
    read_names = {s.name for s in sigs}
    # 根据 {s.name for s in sigs} 设置 read_names，供当前流程后续使用。
    # read_names：保存 {s.name for s in sigs} 的结果；name：当前对象的名称字段；sigs：保存 _read_csv(MAPPING) 的结果
    failures: list[str] = []
    # 给 failures 赋值，供当前处理流程继续使用。
    # failures：本处声明的局部变量，类型为 list[str]

    # ---- 1. csv 加载 ----
    for n in ("cmd.stop", "cmd.modeToggle", "cmd.start", "cmd.conveyor"):
    # 循环处理n in ("cmd.stop", "cmd.modeToggle", "cmd.start", "cmd.conveyor"):，按判断结果进入对应的处理分支。
    # n：逐项遍历 ('cmd.stop', 'cmd.modeToggle', 'cmd.start', 'cmd.c… 的当前元素
        if n not in _cmd_signals:
        # 检查n not in _cmd_signals:，按判断结果进入对应的处理分支。
        # n：逐项遍历 ('cmd.stop', 'cmd.modeToggle', 'cmd.start', 'cmd.c… 的当前元素；_cmd_signals：从 plc_collector 导入的对象，类型为 plc_collector
            failures.append(f"csv: {n} 应在 _cmd_signals(实际: {sorted(_cmd_signals)})")
            # 把一个元素追加到 Python 列表末尾。
            # append：把一个元素追加到 Python 列表末尾；failures：本处声明的局部变量，类型为 list[str]；n：逐项遍历 ('cmd.stop', 'cmd.modeToggle', 'cmd.start', 'cmd.c… 的当前元素；_cmd_signals：从 plc_collector 导入的对象，类型为 plc_collector
    for n in ("robot.joints[0]", "line.state"):
    # 循环处理n in ("robot.joints[0]", "line.state"):，按判断结果进入对应的处理分支。
    # n：逐项遍历 ('robot.joints[0]', 'line.state') 的当前元素
        if n not in read_names:
        # 检查n not in read_names:，按判断结果进入对应的处理分支。
        # n：逐项遍历 ('robot.joints[0]', 'line.state') 的当前元素；read_names：保存 {s.name for s in sigs} 的结果
            failures.append(f"csv: {n} 应在读 sigs(实际: {sorted(read_names)})")
            # 把一个元素追加到 Python 列表末尾。
            # append：把一个元素追加到 Python 列表末尾；failures：本处声明的局部变量，类型为 list[str]；n：逐项遍历 ('robot.joints[0]', 'line.state') 的当前元素；read_names：保存 {s.name for s in sigs} 的结果

    # ---- 2. CMD_DISPATCH 覆盖契约 v1.2 全部 7 个 type ----
    expected = {"start", "stop", "reset", "changeover", "mode_set",
    # 根据 {"start", "stop", "reset", "changeover", "mode_set", 设置 expected，供当前流程后续使用。
    # expected：保存 {'start', 'stop', 'reset', 'changeover', 'mode_set', 'alarm_clear', 'c… 的结果；start：启动 Three.js 的连续渲染循环
                "alarm_clear", "conveyor"}
                # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
                # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    if set(CMD_DISPATCH) != expected:
    # 检查set(CMD_DISPATCH) != expected:，按判断结果进入对应的处理分支。
    # set：按键写入当前映射、缓存或对象的值；CMD_DISPATCH：从 plc_collector 导入的对象，类型为 plc_collector；expected：保存 {'start', 'stop', 'reset', 'changeover', 'mode_set', 'alarm_clear', 'c… 的结果
        failures.append(f"CMD_DISPATCH keys={sorted(CMD_DISPATCH)} != {sorted(expected)}")
        # 把一个元素追加到 Python 列表末尾。
        # append：把一个元素追加到 Python 列表末尾；failures：本处声明的局部变量，类型为 list[str]；CMD_DISPATCH：从 plc_collector 导入的对象，类型为 plc_collector；expected：保存 {'start', 'stop', 'reset', 'changeover', 'mode_set', 'alarm_clear', 'c… 的结果

    # ---- 3. 现场无寄存器的指令 → 必须 rejected ----
    fake = _FakePlc(connected=False)
    # 创建无需现场硬件的模拟 PLC 对象，用于控制逻辑测试，将结果保存或写入 fake。
    # fake：保存 _FakePlc(connected=False) 的结果；connected：连接是否已建立的状态标记，本次传入 False
    for ct in NO_PLC_POINT:
    # 循环处理ct in NO_PLC_POINT:，按判断结果进入对应的处理分支。
    # ct：逐项遍历 NO_PLC_POINT 的当前元素；NO_PLC_POINT：保存 ('reset', 'changeover', 'alarm_clear') 的结果
        ok, msg = _dispatch_cmd(fake, ct, {})
        # 把 _dispatch_cmd(fake, ct, {}) 的结果赋给 ok, msg。
        # ok：操作是否成功的布尔结果；msg：当前收到的消息或提示文字，本次传入 _dispatch_cmd(fake；_dispatch_cmd：按契约和现场写点分派控制指令，拒绝不支持的动作；fake：保存 _FakePlc(connected=False) 的结果；ct：逐项遍历 NO_PLC_POINT 的当前元素
        if ok:
        # 检查ok:，按判断结果进入对应的处理分支。
        # ok：操作是否成功的布尔结果
            failures.append(f"{ct}: 现场无对应寄存器,应 rejected,却 acked(msg={msg!r})")
            # 把一个元素追加到 Python 列表末尾。
            # append：把一个元素追加到 Python 列表末尾；failures：本处声明的局部变量，类型为 list[str]；ct：逐项遍历 NO_PLC_POINT 的当前元素；msg：当前收到的消息或提示文字，本次传入 {msg!r}
        elif "无" not in msg or "寄存器" not in msg:
        # 检查"无" not in msg or "寄存器" not in msg:，按判断结果进入对应的处理分支。
        # msg：当前收到的消息或提示文字
            failures.append(f"{ct}: 拒绝原因应说明无寄存器, got msg={msg!r}")
            # 把一个元素追加到 Python 列表末尾。
            # append：把一个元素追加到 Python 列表末尾；failures：本处声明的局部变量，类型为 list[str]；ct：逐项遍历 NO_PLC_POINT 的当前元素；msg：当前收到的消息或提示文字，本次传入 {msg!r}"
        if fake.writes:
        # 检查fake.writes:，按判断结果进入对应的处理分支。
        # fake：保存 _FakePlc(connected=False) 的结果
            failures.append(f"{ct} 不该写 PLC, got {fake.writes}")
            # 把一个元素追加到 Python 列表末尾。
            # append：把一个元素追加到 Python 列表末尾；failures：本处声明的局部变量，类型为 list[str]；ct：逐项遍历 NO_PLC_POINT 的当前元素；fake：保存 _FakePlc(connected=False) 的结果
    # ---- 4. 未知 type ----
    ok, msg = _dispatch_cmd(fake, "fly_to_moon", {})
    # 把 _dispatch_cmd(fake, "fly_to_moon", {}) 的结果赋给 ok, msg。
    # ok：操作是否成功的布尔结果；msg：当前收到的消息或提示文字，本次传入 _dispatch_cmd(fake；_dispatch_cmd：按契约和现场写点分派控制指令，拒绝不支持的动作；fake：保存 _FakePlc(connected=False) 的结果
    if ok or "未知" not in msg:
    # 检查ok or "未知" not in msg:，按判断结果进入对应的处理分支。
    # ok：操作是否成功的布尔结果；msg：当前收到的消息或提示文字
        failures.append(f"fly_to_moon 应 rejected, got (ok={ok}, msg={msg!r})")
        # 把一个元素追加到 Python 列表末尾。
        # append：把一个元素追加到 Python 列表末尾；failures：本处声明的局部变量，类型为 list[str]；ok：操作是否成功的布尔结果，本次传入 {ok}；msg：当前收到的消息或提示文字，本次传入 {msg!r}

    # ---- 5. mode_set 枚举校验 + 只写一次(不再回写 0) ----
    for act in ("acquire", "release"):
    # 循环处理act in ("acquire", "release"):，按判断结果进入对应的处理分支。
    # act：逐项遍历 ('acquire', 'release') 的当前元素
        fake = _FakePlc(connected=True)
        # 创建无需现场硬件的模拟 PLC 对象，用于控制逻辑测试，将结果保存或写入 fake。
        # fake：保存 _FakePlc(connected=True) 的结果；connected：连接是否已建立的状态标记，本次传入 True
        ok, msg = _dispatch_cmd(fake, "mode_set", {"action": act})
        # 把 _dispatch_cmd(fake, "mode_set", {"action": act}) 的结果赋给 ok, msg。
        # ok：操作是否成功的布尔结果；msg：当前收到的消息或提示文字，本次传入 _dispatch_cmd(fake；_dispatch_cmd：按契约和现场写点分派控制指令，拒绝不支持的动作；fake：保存 _FakePlc(connected=True) 的结果；act：逐项遍历 ('acquire', 'release') 的当前元素
        if not ok:
        # 检查not ok:，按判断结果进入对应的处理分支。
        # ok：操作是否成功的布尔结果
            failures.append(f"mode_set {act} 应 acked, got (ok={ok}, msg={msg!r})")
            # 把一个元素追加到 Python 列表末尾。
            # append：把一个元素追加到 Python 列表末尾；failures：本处声明的局部变量，类型为 list[str]；act：逐项遍历 ('acquire', 'release') 的当前元素；ok：操作是否成功的布尔结果，本次传入 {ok}；msg：当前收到的消息或提示文字，本次传入 {msg!r}
        elif len(fake.writes) != 1:      # PLC 侧自行清零,采集器只写一次
        # 检查len(fake.writes) != 1: # PLC 侧自行清零,采集器只写一次，按判断结果进入对应的处理分支。
        # fake：保存 _FakePlc(connected=True) 的结果
            failures.append(f"mode_set {act} 应只写 1 次, got {len(fake.writes)}")
            # 把一个元素追加到 Python 列表末尾。
            # append：把一个元素追加到 Python 列表末尾；failures：本处声明的局部变量，类型为 list[str]；act：逐项遍历 ('acquire', 'release') 的当前元素；fake：保存 _FakePlc(connected=True) 的结果
        elif fake.writes[0][1] != MODE_TOGGLE_VALUE[act]:
        # 检查fake.writes[0][1] != MODE_TOGGLE_VALUE[act]:，按判断结果进入对应的处理分支。
        # fake：保存 _FakePlc(connected=True) 的结果；MODE_TOGGLE_VALUE：从 plc_collector 导入的对象，类型为 plc_collector；act：逐项遍历 ('acquire', 'release') 的当前元素
            failures.append(f"mode_set {act} 应写 {MODE_TOGGLE_VALUE[act]}, "
            # 把一个元素追加到 Python 列表末尾。
            # failures：本处声明的局部变量，类型为 list[str]；append：把一个元素追加到 Python 列表末尾；act：逐项遍历 ('acquire', 'release') 的当前元素；MODE_TOGGLE_VALUE：从 plc_collector 导入的对象，类型为 plc_collector
                            f"got {fake.writes}")
                            # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
                            # fake：保存 _FakePlc(connected=True) 的结果
        elif fake.writes[0][0] != _cmd_signals["cmd.modeToggle"].address:
        # 检查fake.writes[0][0] != _cmd_signals["cmd.modeToggle"].address:，按判断结果进入对应的处理分支。
        # fake：保存 _FakePlc(connected=True) 的结果；_cmd_signals：从 plc_collector 导入的对象，类型为 plc_collector；address：Modbus 寄存器起始地址，使用从 0 开始的编号
            failures.append(f"mode_set 写地址错, got {fake.writes[0][0]}")
            # 把一个元素追加到 Python 列表末尾。
            # append：把一个元素追加到 Python 列表末尾；failures：本处声明的局部变量，类型为 list[str]；fake：保存 _FakePlc(connected=True) 的结果

    for bad in ("auto", "", None, 1):
    # 循环处理bad in ("auto", "", None, 1):，按判断结果进入对应的处理分支。
    # bad：逐项遍历 ('auto', '', None, 1) 的当前元素
        fake = _FakePlc(connected=False)
        # 创建无需现场硬件的模拟 PLC 对象，用于控制逻辑测试，将结果保存或写入 fake。
        # fake：保存 _FakePlc(connected=False) 的结果；connected：连接是否已建立的状态标记，本次传入 False
        ok, msg = _dispatch_cmd(fake, "mode_set", {"action": bad})
        # 把 _dispatch_cmd(fake, "mode_set", {"action": bad}) 的结果赋给 ok, msg。
        # ok：操作是否成功的布尔结果；msg：当前收到的消息或提示文字，本次传入 _dispatch_cmd(fake；_dispatch_cmd：按契约和现场写点分派控制指令，拒绝不支持的动作；fake：保存 _FakePlc(connected=False) 的结果；bad：逐项遍历 ('auto', '', None, 1) 的当前元素
        if ok or "action" not in msg:
        # 检查ok or "action" not in msg:，按判断结果进入对应的处理分支。
        # ok：操作是否成功的布尔结果；msg：当前收到的消息或提示文字
            failures.append(f"mode_set action={bad!r} 应 rejected, "
            # 把一个元素追加到 Python 列表末尾。
            # failures：本处声明的局部变量，类型为 list[str]；append：把一个元素追加到 Python 列表末尾；bad：逐项遍历 ('auto', '', None, 1) 的当前元素
                            f"got (ok={ok}, msg={msg!r})")
                            # 调用 got；括号中的表达式是传入的参数，供当前处理流程继续使用。
                            # ok：操作是否成功的布尔结果，本次传入 {ok}；msg：当前收到的消息或提示文字，本次传入 {msg!r}

    # ---- 6. conveyor 枚举 + 电平型(只写 1 次) ----
    for act in ("forward", "stop"):
    # 循环处理act in ("forward", "stop"):，按判断结果进入对应的处理分支。
    # act：逐项遍历 ('forward', 'stop') 的当前元素
        fake = _FakePlc(connected=True)
        # 创建无需现场硬件的模拟 PLC 对象，用于控制逻辑测试，将结果保存或写入 fake。
        # fake：保存 _FakePlc(connected=True) 的结果；connected：连接是否已建立的状态标记，本次传入 True
        ok, msg = _dispatch_cmd(fake, "conveyor", {"action": act})
        # 把 _dispatch_cmd(fake, "conveyor", {"action": act}) 的结果赋给 ok, msg。
        # ok：操作是否成功的布尔结果；msg：当前收到的消息或提示文字，本次传入 _dispatch_cmd(fake；_dispatch_cmd：按契约和现场写点分派控制指令，拒绝不支持的动作；fake：保存 _FakePlc(connected=True) 的结果；act：逐项遍历 ('forward', 'stop') 的当前元素
        if not ok:
        # 检查not ok:，按判断结果进入对应的处理分支。
        # ok：操作是否成功的布尔结果
            failures.append(f"conveyor {act} 应 acked, got (ok={ok}, msg={msg!r})")
            # 把一个元素追加到 Python 列表末尾。
            # append：把一个元素追加到 Python 列表末尾；failures：本处声明的局部变量，类型为 list[str]；act：逐项遍历 ('forward', 'stop') 的当前元素；ok：操作是否成功的布尔结果，本次传入 {ok}；msg：当前收到的消息或提示文字，本次传入 {msg!r}
        elif len(fake.writes) != 1:      # 电平型:不自动回 0
        # 检查len(fake.writes) != 1: # 电平型:不自动回 0，按判断结果进入对应的处理分支。
        # fake：保存 _FakePlc(connected=True) 的结果
            failures.append(f"conveyor {act} 电平型应只写 1 次, got {len(fake.writes)}")
            # 把一个元素追加到 Python 列表末尾。
            # append：把一个元素追加到 Python 列表末尾；failures：本处声明的局部变量，类型为 list[str]；act：逐项遍历 ('forward', 'stop') 的当前元素；fake：保存 _FakePlc(connected=True) 的结果
        elif fake.writes[0][1] != CONVEYOR_VALUE[act]:
        # 检查fake.writes[0][1] != CONVEYOR_VALUE[act]:，按判断结果进入对应的处理分支。
        # fake：保存 _FakePlc(connected=True) 的结果；CONVEYOR_VALUE：从 plc_collector 导入的对象，类型为 plc_collector；act：逐项遍历 ('forward', 'stop') 的当前元素
            failures.append(f"conveyor {act} 应写 {CONVEYOR_VALUE[act]}, "
            # 把一个元素追加到 Python 列表末尾。
            # failures：本处声明的局部变量，类型为 list[str]；append：把一个元素追加到 Python 列表末尾；act：逐项遍历 ('forward', 'stop') 的当前元素；CONVEYOR_VALUE：从 plc_collector 导入的对象，类型为 plc_collector
                            f"got {fake.writes[0][1]}")
                            # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
                            # fake：保存 _FakePlc(connected=True) 的结果
        elif fake.writes[0][0] != _cmd_signals["cmd.conveyor"].address:
        # 检查fake.writes[0][0] != _cmd_signals["cmd.conveyor"].address:，按判断结果进入对应的处理分支。
        # fake：保存 _FakePlc(connected=True) 的结果；_cmd_signals：从 plc_collector 导入的对象，类型为 plc_collector；address：Modbus 寄存器起始地址，使用从 0 开始的编号
            failures.append(f"conveyor 写地址错, got {fake.writes[0][0]}")
            # 把一个元素追加到 Python 列表末尾。
            # append：把一个元素追加到 Python 列表末尾；failures：本处声明的局部变量，类型为 list[str]；fake：保存 _FakePlc(connected=True) 的结果

    for bad in ("reverse", "", None):
    # 循环处理bad in ("reverse", "", None):，按判断结果进入对应的处理分支。
    # bad：逐项遍历 ('reverse', '', None) 的当前元素
        fake = _FakePlc(connected=False)
        # 创建无需现场硬件的模拟 PLC 对象，用于控制逻辑测试，将结果保存或写入 fake。
        # fake：保存 _FakePlc(connected=False) 的结果；connected：连接是否已建立的状态标记，本次传入 False
        ok, msg = _dispatch_cmd(fake, "conveyor", {"action": bad})
        # 把 _dispatch_cmd(fake, "conveyor", {"action": bad}) 的结果赋给 ok, msg。
        # ok：操作是否成功的布尔结果；msg：当前收到的消息或提示文字，本次传入 _dispatch_cmd(fake；_dispatch_cmd：按契约和现场写点分派控制指令，拒绝不支持的动作；fake：保存 _FakePlc(connected=False) 的结果；bad：逐项遍历 ('reverse', '', None) 的当前元素
        if ok or "action" not in msg:
        # 检查ok or "action" not in msg:，按判断结果进入对应的处理分支。
        # ok：操作是否成功的布尔结果；msg：当前收到的消息或提示文字
            failures.append(f"conveyor action={bad!r} 应 rejected, "
            # 把一个元素追加到 Python 列表末尾。
            # failures：本处声明的局部变量，类型为 list[str]；append：把一个元素追加到 Python 列表末尾；bad：逐项遍历 ('reverse', '', None) 的当前元素
                            f"got (ok={ok}, msg={msg!r})")
                            # 调用 got；括号中的表达式是传入的参数，供当前处理流程继续使用。
                            # ok：操作是否成功的布尔结果，本次传入 {ok}；msg：当前收到的消息或提示文字，本次传入 {msg!r}

    # ---- 7. start / stop:只写一次(PLC 完成后自行置 0),地址正确、无额外延时 ----
    for ct, sig_name in (("start", "cmd.start"), ("stop", "cmd.stop")):
    # 循环处理ct, sig_name in (("start", "cmd.start"), ("stop", "cmd.stop")):，按判断结果进入对应的处理分支。
    # ct：逐项遍历 (('start', 'cmd.start'), ('stop', 'cmd.stop')) 的当前元素；sig_name：逐项遍历 (('start', 'cmd.start'), ('stop', 'cmd.stop')) 的当前元素
        fake = _FakePlc(connected=True)
        # 创建无需现场硬件的模拟 PLC 对象，用于控制逻辑测试，将结果保存或写入 fake。
        # fake：保存 _FakePlc(connected=True) 的结果；connected：连接是否已建立的状态标记，本次传入 True
        t0 = _time.time()
        # 读取当前 Unix 时间，供采集间隔与消息时间戳计算，将结果保存或写入 t0。
        # t0：保存 _time.time() 的结果；time：Python 时间与暂停接口；_time：从 time 导入的模块，类型为 time
        ok, msg = _dispatch_cmd(fake, ct, {})
        # 把 _dispatch_cmd(fake, ct, {}) 的结果赋给 ok, msg。
        # ok：操作是否成功的布尔结果；msg：当前收到的消息或提示文字，本次传入 _dispatch_cmd(fake；_dispatch_cmd：按契约和现场写点分派控制指令，拒绝不支持的动作；fake：保存 _FakePlc(connected=True) 的结果；ct：逐项遍历 (('start', 'cmd.start'), ('stop', 'cmd.stop')) 的当前元素
        elapsed_ms = (_time.time() - t0) * 1000
        # 读取当前 Unix 时间，供采集间隔与消息时间戳计算，将结果保存或写入 elapsed_ms。
        # elapsed_ms：保存 (_time.time() - t0) * 1000 的结果；t0：保存 _time.time() 的结果；time：Python 时间与暂停接口；_time：从 time 导入的模块，类型为 time
        if not ok:
        # 检查not ok:，按判断结果进入对应的处理分支。
        # ok：操作是否成功的布尔结果
            failures.append(f"{ct} 真写应 acked, got (ok={ok}, msg={msg!r})")
            # 把一个元素追加到 Python 列表末尾。
            # append：把一个元素追加到 Python 列表末尾；failures：本处声明的局部变量，类型为 list[str]；ct：逐项遍历 (('start', 'cmd.start'), ('stop', 'cmd.stop')) 的当前元素；ok：操作是否成功的布尔结果，本次传入 {ok}；msg：当前收到的消息或提示文字，本次传入 {msg!r}
        if len(fake.writes) != 1:
        # 检查len(fake.writes) != 1:，按判断结果进入对应的处理分支。
        # fake：保存 _FakePlc(connected=True) 的结果
            failures.append(f"{ct} 应只写 1 次(PLC 自行清零), got {fake.writes}")
            # 把一个元素追加到 Python 列表末尾。
            # append：把一个元素追加到 Python 列表末尾；failures：本处声明的局部变量，类型为 list[str]；ct：逐项遍历 (('start', 'cmd.start'), ('stop', 'cmd.stop')) 的当前元素；fake：保存 _FakePlc(connected=True) 的结果
        elif fake.writes[0][1] != 1:
        # 检查fake.writes[0][1] != 1:，按判断结果进入对应的处理分支。
        # fake：保存 _FakePlc(connected=True) 的结果
            failures.append(f"{ct} 应写 1, got {fake.writes[0][1]}")
            # 把一个元素追加到 Python 列表末尾。
            # append：把一个元素追加到 Python 列表末尾；failures：本处声明的局部变量，类型为 list[str]；ct：逐项遍历 (('start', 'cmd.start'), ('stop', 'cmd.stop')) 的当前元素；fake：保存 _FakePlc(connected=True) 的结果
        elif fake.writes[0][0] != _cmd_signals[sig_name].address:
        # 检查fake.writes[0][0] != _cmd_signals[sig_name].address:，按判断结果进入对应的处理分支。
        # fake：保存 _FakePlc(connected=True) 的结果；_cmd_signals：从 plc_collector 导入的对象，类型为 plc_collector；sig_name：逐项遍历 (('start', 'cmd.start'), ('stop', 'cmd.stop')) 的当前元素；address：Modbus 寄存器起始地址，使用从 0 开始的编号
            failures.append(f"{ct} 写地址错(应 {_cmd_signals[sig_name].address}), "
            # 把一个元素追加到 Python 列表末尾。
            # failures：本处声明的局部变量，类型为 list[str]；append：把一个元素追加到 Python 列表末尾；ct：逐项遍历 (('start', 'cmd.start'), ('stop', 'cmd.stop')) 的当前元素；_cmd_signals：从 plc_collector 导入的对象，类型为 plc_collector；sig_name：逐项遍历 (('start', 'cmd.start'), ('stop', 'cmd.stop')) 的当前元素；address：Modbus 寄存器起始地址，使用从 0 开始的编号
                            f"got {fake.writes[0][0]}")
                            # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
                            # fake：保存 _FakePlc(connected=True) 的结果
        if elapsed_ms > 50:
        # 检查elapsed_ms > 50:，按判断结果进入对应的处理分支。
        # elapsed_ms：保存 (_time.time() - t0) * 1000 的结果
            failures.append(f"{ct} 不应再有脉冲 sleep 延时, got {elapsed_ms:.1f}ms")
            # 把一个元素追加到 Python 列表末尾。
            # append：把一个元素追加到 Python 列表末尾；failures：本处声明的局部变量，类型为 list[str]；ct：逐项遍历 (('start', 'cmd.start'), ('stop', 'cmd.stop')) 的当前元素；elapsed_ms：保存 (_time.time() - t0) * 1000 的结果

    # ---- 8. PLC 未连接 → 全部 rejected,且一个字节都不写(不假 ack) ----
    fake = _FakePlc(connected=False)
    # 创建无需现场硬件的模拟 PLC 对象，用于控制逻辑测试，将结果保存或写入 fake。
    # fake：保存 _FakePlc(connected=False) 的结果；connected：连接是否已建立的状态标记，本次传入 False
    for ct, params in (("start", {}), ("stop", {}),
    # 循环处理ct, params in (("start", {}), ("stop", {}),，按判断结果进入对应的处理分支。
    # ct：逐项遍历 (('start', {}), ('stop', {}), ('mode_set', {'actio… 的当前元素；params：指令附加参数对象；start：启动 Three.js 的连续渲染循环
                       ("mode_set", {"action": "acquire"}),
                       # 开始当前表达式的分组或数组内容，供当前处理流程继续使用。
                       # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
                       ("conveyor", {"action": "forward"})):
                       # 开始当前表达式的分组或数组内容，供当前处理流程继续使用。
                       # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        ok, msg = _dispatch_cmd(fake, ct, params)
        # 把 _dispatch_cmd(fake, ct, params) 的结果赋给 ok, msg。
        # ok：操作是否成功的布尔结果；msg：当前收到的消息或提示文字，本次传入 _dispatch_cmd(fake；_dispatch_cmd：按契约和现场写点分派控制指令，拒绝不支持的动作；fake：保存 _FakePlc(connected=False) 的结果；ct：逐项遍历 (('start', {}), ('stop', {}), ('mode_set', {'actio… 的当前元素；params：指令附加参数对象
        if ok or "PLC 未连接" not in msg:
        # 检查ok or "PLC 未连接" not in msg:，按判断结果进入对应的处理分支。
        # ok：操作是否成功的布尔结果；msg：当前收到的消息或提示文字
            failures.append(f"PLC 未连接时 {ct} 应 rejected 且提示未连接, "
            # 把一个元素追加到 Python 列表末尾。
            # failures：本处声明的局部变量，类型为 list[str]；append：把一个元素追加到 Python 列表末尾；ct：逐项遍历 (('start', {}), ('stop', {}), ('mode_set', {'actio… 的当前元素
                            f"got (ok={ok}, msg={msg!r})")
                            # 调用 got；括号中的表达式是传入的参数，供当前处理流程继续使用。
                            # ok：操作是否成功的布尔结果，本次传入 {ok}；msg：当前收到的消息或提示文字，本次传入 {msg!r}
    if fake.writes:
    # 检查fake.writes:，按判断结果进入对应的处理分支。
    # fake：保存 _FakePlc(connected=False) 的结果
        failures.append(f"PLC 未连接时不应写 PLC, got {fake.writes}")
        # 把一个元素追加到 Python 列表末尾。
        # append：把一个元素追加到 Python 列表末尾；failures：本处声明的局部变量，类型为 list[str]；fake：保存 _FakePlc(connected=False) 的结果

    # ---- 9. PLC 通信异常 → rejected ----
    fake = _FakePlc(connected=True, raise_exc=True)
    # 创建无需现场硬件的模拟 PLC 对象，用于控制逻辑测试，将结果保存或写入 fake。
    # fake：保存 _FakePlc(connected=True, raise_exc=True) 的结果；connected：连接是否已建立的状态标记，本次传入 True
    ok, msg = _dispatch_cmd(fake, "start", {})
    # 把 _dispatch_cmd(fake, "start", {}) 的结果赋给 ok, msg。
    # ok：操作是否成功的布尔结果；msg：当前收到的消息或提示文字，本次传入 _dispatch_cmd(fake；_dispatch_cmd：按契约和现场写点分派控制指令，拒绝不支持的动作；fake：保存 _FakePlc(connected=True, raise_exc=True) 的结果
    if ok or "通信异常" not in msg:
    # 检查ok or "通信异常" not in msg:，按判断结果进入对应的处理分支。
    # ok：操作是否成功的布尔结果；msg：当前收到的消息或提示文字
        failures.append(f"PLC 异常应 rejected, got (ok={ok}, msg={msg!r})")
        # 把一个元素追加到 Python 列表末尾。
        # append：把一个元素追加到 Python 列表末尾；failures：本处声明的局部变量，类型为 list[str]；ok：操作是否成功的布尔结果，本次传入 {ok}；msg：当前收到的消息或提示文字，本次传入 {msg!r}

    # 同一 Modbus 连接的读和写必须串行，防止采集线程与 MQTT 回调交错收包。
    read_started = threading.Event()
    # 创建线程间通知事件，供采集循环等待或停止，将结果保存或写入 read_started。
    # read_started：保存 threading.Event() 的结果；threading：Python 线程与锁接口
    release_read = threading.Event()
    # 创建线程间通知事件，供采集循环等待或停止，将结果保存或写入 release_read。
    # release_read：保存 threading.Event() 的结果；threading：Python 线程与锁接口
    write_started = threading.Event()
    # 创建线程间通知事件，供采集循环等待或停止，将结果保存或写入 write_started。
    # write_started：保存 threading.Event() 的结果；threading：Python 线程与锁接口

    class _LockedCli:
    # 定义类 _LockedCli。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        # 这一段定义 read_holding_registers，用于模拟读取寄存器接口，供检查读写行为的测试使用。
        def read_holding_registers(self, address, count, device_id):
        # 定义函数 read_holding_registers。
        # read_holding_registers：通过 Modbus 功能码 0x03 读取连续保持寄存器，返回响应对象；address：Modbus 寄存器起始地址，使用从 0 开始的编号；count：本次读取或数据结构声明的数量；device_id：pymodbus 当前接口的目标设备站号参数
            read_started.set()
            # 按键写入当前映射、缓存或对象的值。
            # set：按键写入当前映射、缓存或对象的值；read_started：保存 threading.Event() 的结果
            if not release_read.wait(2):
            # 检查not release_read.wait(2):，按判断结果进入对应的处理分支。
            # release_read：保存 threading.Event() 的结果
                raise TimeoutError("mock 读超时")
                # 按本行指定的错误类型或信息终止当前处理并交给上层处理。
                # 返回值或异常使用上方流程得到的数据，由当前函数的调用方处理
            return type("Reply", (), {"registers": [0] * count, "isError": lambda self: False})()
            # 把type("Reply", (), {"registers": [0] * count, "isError": lambda self: False})()作为当前函数的结果返回。
            # type：当前报文、指令或对象的类别字段；count：本次读取或数据结构声明的数量
            # 这一段实现了模拟读取寄存器接口，供检查读写行为的测试使用；返回值或异常由调用方按当前分支处理。

        # 这一段定义 write_register，用于模拟写寄存器接口，记录调用或产生指定测试结果。
        def write_register(self, address, value, device_id):
        # 定义函数 write_register。
        # write_register：向一个 Modbus 保持寄存器写入指定值，返回写入响应；address：Modbus 寄存器起始地址，使用从 0 开始的编号；value：当前字段或点位的实际取值；device_id：pymodbus 当前接口的目标设备站号参数
            write_started.set()
            # 按键写入当前映射、缓存或对象的值。
            # set：按键写入当前映射、缓存或对象的值；write_started：保存 threading.Event() 的结果
            return type("Reply", (), {"isError": lambda self: False})()
            # 把type("Reply", (), {"isError": lambda self: False})()作为当前函数的结果返回。
            # type：当前报文、指令或对象的类别字段
            # 这一段实现了模拟写寄存器接口，记录调用或产生指定测试结果；返回值或异常由调用方按当前分支处理。

    plc = Plc("127.0.0.1", 503, 2)
    # 创建或使用本文件封装的 PLC 客户端，负责串行读写、重连和通信状态管理，将结果保存或写入 plc。
    # plc：保存 Plc('127.0.0.1', 503, 2) 的结果；Plc：本文件封装的 PLC 客户端，负责串行读写、重连和通信状态管理
    plc.cli = _LockedCli()
    # 把 _LockedCli() 的结果赋给 plc.cli。
    # cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求，本次传入 _LockedCli(；plc：保存 _LockedCli() 的结果
    plc.connected = True
    # 把 True 的结果赋给 plc.connected。
    # connected：连接是否已建立的状态标记，本次传入 True；plc：保存 True 的结果
    reader = threading.Thread(target=plc.read_all, args=([sigs[0]],), daemon=True)
    # 创建后台线程，让循环任务独立运行，将结果保存或写入 reader。
    # reader：保存 threading.Thread(target=plc.read_all, args=([sigs[0]],), daemon=True) 的结果；threading：Python 线程与锁接口；read_all：读取全部配置的只读点位，逐点解码并保留读取失败的空值；plc：保存 True 的结果；sigs：保存 _read_csv(MAPPING) 的结果
    writer = threading.Thread(target=_dispatch_cmd, args=(plc, "start", {}), daemon=True)
    # 创建后台线程，让循环任务独立运行，将结果保存或写入 writer。
    # writer：保存 threading.Thread(target=_dispatch_cmd, args=(plc, 'start', {}), daemon… 的结果；threading：Python 线程与锁接口；_dispatch_cmd：按契约和现场写点分派控制指令，拒绝不支持的动作；plc：保存 True 的结果
    reader.start()
    # 启动 Three.js 的连续渲染循环。
    # start：启动 Three.js 的连续渲染循环；reader：保存 threading.Thread(target=plc.read_all, args=([sigs[0]],), daemon=True) 的结果
    if not read_started.wait(1):
    # 检查not read_started.wait(1):，按判断结果进入对应的处理分支。
    # read_started：保存 threading.Event() 的结果
        failures.append("读线程未进入 Modbus 调用")
        # 把一个元素追加到 Python 列表末尾。
        # append：把一个元素追加到 Python 列表末尾；failures：本处声明的局部变量，类型为 list[str]
    writer.start()
    # 启动 Three.js 的连续渲染循环。
    # start：启动 Three.js 的连续渲染循环；writer：保存 threading.Thread(target=_dispatch_cmd, args=(plc, 'start', {}), daemon… 的结果
    if write_started.wait(0.05):
    # 检查write_started.wait(0.05):，按判断结果进入对应的处理分支。
    # write_started：保存 threading.Event() 的结果
        failures.append("读操作尚未结束时，写操作进入了同一 Modbus 连接")
        # 把一个元素追加到 Python 列表末尾。
        # append：把一个元素追加到 Python 列表末尾；failures：本处声明的局部变量，类型为 list[str]
    release_read.set()
    # 按键写入当前映射、缓存或对象的值。
    # set：按键写入当前映射、缓存或对象的值；release_read：保存 threading.Event() 的结果
    reader.join(2)
    # 把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准。
    # join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准；reader：保存 threading.Thread(target=plc.read_all, args=([sigs[0]],), daemon=True) 的结果
    writer.join(2)
    # 把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准。
    # join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准；writer：保存 threading.Thread(target=_dispatch_cmd, args=(plc, 'start', {}), daemon… 的结果
    if not write_started.is_set():
    # 检查not write_started.is_set():，按判断结果进入对应的处理分支。
    # write_started：保存 threading.Event() 的结果
        failures.append("读操作结束后写操作仍未执行")
        # 把一个元素追加到 Python 列表末尾。
        # append：把一个元素追加到 Python 列表末尾；failures：本处声明的局部变量，类型为 list[str]

    print(f"CMD_DISPATCH types: {sorted(CMD_DISPATCH)}")
    # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
    # CMD_DISPATCH：从 plc_collector 导入的对象，类型为 plc_collector
    print(f"现场可执行: {sorted(set(CMD_DISPATCH) - set(NO_PLC_POINT))}")
    # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
    # set：按键写入当前映射、缓存或对象的值；CMD_DISPATCH：从 plc_collector 导入的对象，类型为 plc_collector；NO_PLC_POINT：保存 ('reset', 'changeover', 'alarm_clear') 的结果
    print(f"现场无寄存器: {sorted(NO_PLC_POINT)}")
    # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
    # NO_PLC_POINT：保存 ('reset', 'changeover', 'alarm_clear') 的结果
    print()
    # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    if failures:
    # 检查failures:，按判断结果进入对应的处理分支。
    # failures：本处声明的局部变量，类型为 list[str]
        print(f"!!! {len(failures)} failures:")
        # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
        # failures：本处声明的局部变量，类型为 list[str]
        for f in failures:
        # 循环处理f in failures:，按判断结果进入对应的处理分支。
        # f：逐项遍历 failures 的当前元素；failures：本处声明的局部变量，类型为 list[str]
            print(f"  - {f}")
            # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
            # f：逐项遍历 failures 的当前元素
        return 1
        # 把1作为当前函数的结果返回。
        # 返回值或异常使用上方流程得到的数据，由当前函数的调用方处理
    print(f"=== ALL PASSED ({len(sigs)} read + {len(_cmd_signals)} cmd) ===")
    # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
    # sigs：保存 _read_csv(MAPPING) 的结果；_cmd_signals：从 plc_collector 导入的对象，类型为 plc_collector
    return 0
    # 把0作为当前函数的结果返回。
    # 返回值或异常使用上方流程得到的数据，由当前函数的调用方处理
    # 这一段实现了用模拟客户端检查指令分派、拒绝路径和读写互斥行为；返回值或异常由调用方按当前分支处理。


if __name__ == "__main__":
# 检查__name__ == "__main__":，按判断结果进入对应的处理分支。
# 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    sys.exit(main())
    # 以指定状态码结束当前进程或处理流程。
    # sys：Python 运行环境与退出状态接口；main：本文件定义的函数，用于运行  的入口流程
    # 这一段提供了验证现场指令分派、缺失连接拒绝和通信互斥逻辑所需的定义和处理逻辑，结果交由调用方或运行环境使用。
