# docs/contract/register-mapping.template.csv 逐行注释

[打开源码](../../../../docs/contract/register-mapping.template.csv) · 14 行 · 14 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
signal,device_id,protocol,address,data_type,byte_order,scale,offset,unit,poll_group,description
/* 注释：声明 CSV 列名；后续每行按这些列的顺序解释。 */
```

**源码第 2 行**

```text
robot01.j1,robot-01,modbus_tcp,40001,float32,ABCD,1,0,deg,fast,机器人 J1 关节角
/* 注释：定义一条映射记录：signal=robot01.j1；device_id=robot-01；protocol=modbus_tcp；address=40001；data_type=float32；byte_order=ABCD；scale=1；offset=0；unit=deg；poll_group=fast；description=机器人 J1 关节角。 */
```

**源码第 3 行**

```text
robot01.j2,robot-01,modbus_tcp,40003,float32,ABCD,1,0,deg,fast,机器人 J2 关节角
/* 注释：定义一条映射记录：signal=robot01.j2；device_id=robot-01；protocol=modbus_tcp；address=40003；data_type=float32；byte_order=ABCD；scale=1；offset=0；unit=deg；poll_group=fast；description=机器人 J2 关节角。 */
```

**源码第 4 行**

```text
robot01.j3,robot-01,modbus_tcp,40005,float32,ABCD,1,0,deg,fast,机器人 J3 关节角
/* 注释：定义一条映射记录：signal=robot01.j3；device_id=robot-01；protocol=modbus_tcp；address=40005；data_type=float32；byte_order=ABCD；scale=1；offset=0；unit=deg；poll_group=fast；description=机器人 J3 关节角。 */
```

**源码第 5 行**

```text
robot01.j4,robot-01,modbus_tcp,40007,float32,ABCD,1,0,deg,fast,机器人 J4 关节角
/* 注释：定义一条映射记录：signal=robot01.j4；device_id=robot-01；protocol=modbus_tcp；address=40007；data_type=float32；byte_order=ABCD；scale=1；offset=0；unit=deg；poll_group=fast；description=机器人 J4 关节角。 */
```

**源码第 6 行**

```text
robot01.j5,robot-01,modbus_tcp,40009,float32,ABCD,1,0,deg,fast,机器人 J5 关节角
/* 注释：定义一条映射记录：signal=robot01.j5；device_id=robot-01；protocol=modbus_tcp；address=40009；data_type=float32；byte_order=ABCD；scale=1；offset=0；unit=deg；poll_group=fast；description=机器人 J5 关节角。 */
```

**源码第 7 行**

```text
robot01.j6,robot-01,modbus_tcp,40011,float32,ABCD,1,0,deg,fast,机器人 J6 关节角
/* 注释：定义一条映射记录：signal=robot01.j6；device_id=robot-01；protocol=modbus_tcp；address=40011；data_type=float32；byte_order=ABCD；scale=1；offset=0；unit=deg；poll_group=fast；description=机器人 J6 关节角。 */
```

**源码第 8 行**

```text
robot01.speed_pct,robot-01,modbus_tcp,40013,uint16,,1,0,%,slow,速度倍率
/* 注释：定义一条映射记录：signal=robot01.speed_pct；device_id=robot-01；protocol=modbus_tcp；address=40013；data_type=uint16；scale=1；offset=0；unit=%；poll_group=slow；description=速度倍率。 */
```

**源码第 9 行**

```text
robot01.mode,robot-01,modbus_tcp,40014,uint16,,1,0,,slow,运行模式(0手动/1自动)
/* 注释：定义一条映射记录：signal=robot01.mode；device_id=robot-01；protocol=modbus_tcp；address=40014；data_type=uint16；scale=1；offset=0；poll_group=slow；description=运行模式(0手动/1自动)。 */
```

**源码第 10 行**

```text
robot01.alarm_code,robot-01,modbus_tcp,40015,uint16,,1,0,,fast,当前报警码(0=无)
/* 注释：定义一条映射记录：signal=robot01.alarm_code；device_id=robot-01；protocol=modbus_tcp；address=40015；data_type=uint16；scale=1；offset=0；poll_group=fast；description=当前报警码(0=无)。 */
```

**源码第 11 行**

```text
line.state,line-01,modbus_tcp,40020,uint16,,1,0,,fast,产线状态(0停止/1运行/2报警)
/* 注释：定义一条映射记录：signal=line.state；device_id=line-01；protocol=modbus_tcp；address=40020；data_type=uint16；scale=1；offset=0；poll_group=fast；description=产线状态(0停止/1运行/2报警)。 */
```

**源码第 12 行**

```text
line.good_count,line-01,modbus_tcp,40021,uint32,ABCD,1,0,pcs,slow,良品累计
/* 注释：定义一条映射记录：signal=line.good_count；device_id=line-01；protocol=modbus_tcp；address=40021；data_type=uint32；byte_order=ABCD；scale=1；offset=0；unit=pcs；poll_group=slow；description=良品累计。 */
```

**源码第 13 行**

```text
line.ng_count,line-01,modbus_tcp,40023,uint32,ABCD,1,0,pcs,slow,不良品累计
/* 注释：定义一条映射记录：signal=line.ng_count；device_id=line-01；protocol=modbus_tcp；address=40023；data_type=uint32；byte_order=ABCD；scale=1；offset=0；unit=pcs；poll_group=slow；description=不良品累计。 */
```

**源码第 14 行**

```text
line.beat_ms,line-01,modbus_tcp,40025,uint32,ABCD,1,0,ms,slow,最近一件节拍
/* 注释：定义一条映射记录：signal=line.beat_ms；device_id=line-01；protocol=modbus_tcp；address=40025；data_type=uint32；byte_order=ABCD；scale=1；offset=0；unit=ms；poll_group=slow；description=最近一件节拍。 */
```
