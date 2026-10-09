# register-mapping.csv 填写指南(给电气工程师)

## 0. 这张表干什么

plc_collector.py 读这张表 → 周期性地从 PLC 拉 Holding Register → 翻译成数据契约 JSON → 发布到 MQTT。
**改这张表 = 改采集逻辑,代码不动**。

## 1. PLC 现状(2026-10-09 探测)

| 项 | 值 |
|---|---|
| IP | 192.168.10.31 |
| 端口 | 503 |
| Unit ID | 2 |
| **可读 HOLD_REG 区段** | **仅 [0..10] = 11 个 word** ← 需要扩大 |
| 当前数据 | 全 0(机器人未接入 / PLC 未运行) |

## 2. TIA Portal 里要做的事(3 步)

### 步骤 ①:扩 DB3

打开 `程序段 3: plc服务端`,看 DB3 的结构。
**当前 DB3 估计只有 11 个 word**,需要把所有要采集的变量都加进去:

```
DB3 (plc服务端 DB)
├─ joints    : ARRAY[0..5] OF REAL    ← 12 word
├─ tcp       : ARRAY[0..5] OF REAL    ← 12 word (可选)
├─ speedPct  : REAL / INT             ←  1~2 word
├─ mode      : INT                    ←  1 word
├─ program   : INT                    ←  1 word
├─ alarmCode : INT                    ←  1 word
├─ state     : INT                    ←  1 word
├─ goodCount : DINT / DWORD           ←  2 word
├─ ngCount   : DINT / DWORD           ←  2 word
└─ beatMs    : INT / REAL             ←  1~2 word
                                  合计 ≈ 36 word
```

DB3 里**所有变量必须是连续偏移**(不能在变量中间插别的),否则 Modbus 地址就不连续。

### 步骤 ②:把变量映射到 DB3

在 PLC 程序里:
```pascal
// 把现场寄存器(比如 M 区 / I 区 / 过程映像)复制到 DB3
// 这是工程里通常要做的事,DB3 是 Modbus 看的"窗口"
DB3.joints[0]   := "DB_robot".j1_act;     // 例:从机器人 DB 复制
DB3.joints[1]   := "DB_robot".j2_act;
... (共 6 个关节)
DB3.speedPct    := "DB_plc".speed_override;
DB3.mode        := "DB_plc".op_mode;       // 0=manual 1=auto 2=remote 3=error
DB3.alarmCode   := "DB_plc".alarm_word;
DB3.state       := "DB_plc".line_state;    // 0=offline 1=idle 2=running 3=alarm
DB3.goodCount   := "DB_plc".good_counter;
DB3.ngCount     := "DB_plc".ng_counter;
DB3.beatMs      := "DB_plc".cycle_time_ms;
```

**字序**:TIA 的 REAL 默认是大端(高字节在前),Modbus 协议也是大端,所以 **不需要字节交换**。
若发现浮点读出来是垃圾数字,在 plc_collector.py 里把 `Endian.BIG` 改成 `Endian.LITTLE` 或 `Endian.BIG_SWAP` / `Endian.LITTLE_SWAP` 二选一。

### 步骤 ③:扩 MB_SERVER 的 HOLD_REG 长度

`程序段 3: plc服务端` 那个 `MB_SERVER` 功能块:
- 引脚 `MB_HOLD_REG` 接的是 DB3 的一个区域,**长度要覆盖 DB3 里所有变量**
- 若 DB3 现在只有 11 word,把 MB_HOLD_REG 长度改为 36(或 50 留冗余)

## 3. 算 Modbus address

**address = DB3 字节偏移 ÷ 2**(因为 Modbus 是 word 单位,TIA 是 byte 单位)

| DB3 变量 | TIA 字节偏移 | Modbus address |
|---|---|---|
| joints[0] | 0 | 0 |
| joints[1] | 4 | 2 |
| joints[2] | 8 | 4 |
| joints[3] | 12 | 6 |
| joints[4] | 16 | 8 |
| joints[5] | 20 | 10 |
| tcp[0] | 24 | 12 |
| tcp[1] | 28 | 14 |
| ... | ... | ... |
| speedPct | 72 | 36 |
| mode | 74 | 37 |
| ... | ... | ... |

**TIA 里查 DB3 字节偏移**:右键 DB3 → "属性" → 选中变量 → 右下角 "偏移量" 列。

## 4. 缩放系数 scale

PLC 里常把小数乘 10 / 100 存成 INT(节省存储/避免浮点):
- 例:PLC 存 `angle_x100`(实际角度 × 100),读出来要 `÷ 100`,则表里写 `scale=0.01`
- 例:PLC 存原始 `REAL` 角度,直接写 `scale=1.0`

## 5. 验证步骤

1. 把表填好 → 保存
2. 跑冒烟测试:`python _plc_smoke.py`(已留)
3. 看输出:
   - 全部 ERR → MB_SERVER 还没扩 / address 错
   - 有非零数据 → OK,把 scale/offset 校准
4. 跑主程序:`python plc_collector.py`
5. 浏览器打开 http://localhost:5173,看机械臂角度是不是和 PLC 工程软件(博图/WINCC)显示一致

## 6. 验证 PLC 实时刷新的最简单办法

在 TIA Portal 里**强制**(强制表 Force Table)DB3.joints[0] = 45.0,然后在 IPC 这边读 Holding Register 0..3:
- 如果读到接近 45.0 → 全链路 OK
- 如果还是 0 → MB_SERVER 没扩 / DB3 没被 PLC 程序写入

## 7. 备份与版本

| 文件 | 作用 |
|---|---|
| `register-mapping.csv` | **当前生效**,电气工程师改这张 |
| `register-mapping.template.csv` | 空白模板,新增产线/设备时复制 |
| `register-mapping.README.md` | 本文件,填写指南 |
