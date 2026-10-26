# edge/register-mapping.csv 逐行注释

[打开源码](../../../edge/register-mapping.csv) · 79 行 · 18 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 34 行**

```text
name,address,type,scale,offset,unit,note
/* 注释：声明 CSV 列名；后续每行按这些列的顺序解释。 */
```

**源码第 39 行**

```text
robot.joints[0],0,INT,0.1,0,deg,J1 关节角 (dataDB[0] 字节0)
/* 注释：定义一条映射记录：name=robot.joints[0]；address=0；type=INT；scale=0.1；offset=0；unit=deg；note=J1 关节角 (dataDB[0] 字节0)。 */
```

**源码第 40 行**

```text
robot.joints[1],1,INT,0.1,0,deg,J2 关节角 (dataDB[1] 字节2)
/* 注释：定义一条映射记录：name=robot.joints[1]；address=1；type=INT；scale=0.1；offset=0；unit=deg；note=J2 关节角 (dataDB[1] 字节2)。 */
```

**源码第 41 行**

```text
robot.joints[2],2,INT,0.1,0,deg,J3 关节角 (dataDB[2] 字节4)
/* 注释：定义一条映射记录：name=robot.joints[2]；address=2；type=INT；scale=0.1；offset=0；unit=deg；note=J3 关节角 (dataDB[2] 字节4)。 */
```

**源码第 42 行**

```text
robot.joints[3],3,INT,0.1,0,deg,J4 关节角 (dataDB[3] 字节6)
/* 注释：定义一条映射记录：name=robot.joints[3]；address=3；type=INT；scale=0.1；offset=0；unit=deg；note=J4 关节角 (dataDB[3] 字节6)。 */
```

**源码第 43 行**

```text
robot.joints[4],4,INT,0.1,0,deg,J5 关节角 (dataDB[4] 字节8)
/* 注释：定义一条映射记录：name=robot.joints[4]；address=4；type=INT；scale=0.1；offset=0；unit=deg；note=J5 关节角 (dataDB[4] 字节8)。 */
```

**源码第 44 行**

```text
robot.joints[5],5,INT,0.1,0,deg,J6 关节角 (dataDB[5] 字节10)
/* 注释：定义一条映射记录：name=robot.joints[5]；address=5；type=INT；scale=0.1；offset=0；unit=deg；note=J6 关节角 (dataDB[5] 字节10)。 */
```

**源码第 50 行**

```text
line.state,6,UINT,1.0,0,,产线状态 (dataDB[6] 字节12) 10值枚举见 STATE_MAP
/* 注释：定义一条映射记录：name=line.state；address=6；type=UINT；scale=1.0；offset=0；note=产线状态 (dataDB[6] 字节12) 10值枚举见 STATE_MAP。 */
```

**源码第 54 行**

```text
io.sensorIn,11,UINT,1.0,0,,入料传感器 (dataDB[11] 字节22) 1=有料 0=无料
/* 注释：定义一条映射记录：name=io.sensorIn；address=11；type=UINT；scale=1.0；offset=0；note=入料传感器 (dataDB[11] 字节22) 1=有料 0=无料。 */
```

**源码第 55 行**

```text
io.sensorArrive,12,UINT,1.0,0,,到料传感器 (dataDB[12] 字节24) 1=有料 0=无料
/* 注释：定义一条映射记录：name=io.sensorArrive；address=12；type=UINT；scale=1.0；offset=0；note=到料传感器 (dataDB[12] 字节24) 1=有料 0=无料。 */
```

**源码第 56 行**

```text
io.sensorRetreat,13,UINT,1.0,0,,退料传感器 (dataDB[13] 字节26) 1=有料 0=无料
/* 注释：定义一条映射记录：name=io.sensorRetreat；address=13；type=UINT；scale=1.0；offset=0；note=退料传感器 (dataDB[13] 字节26) 1=有料 0=无料。 */
```

**源码第 57 行**

```text
io.lightColor,14,UINT,1.0,0,,产线灯光颜色 (dataDB[14] 字节28) 0=绿灯 1=黄灯 2=红灯
/* 注释：定义一条映射记录：name=io.lightColor；address=14；type=UINT；scale=1.0；offset=0；note=产线灯光颜色 (dataDB[14] 字节28) 0=绿灯 1=黄灯 2=红灯。 */
```

**源码第 58 行**

```text
io.trayUp,15,UINT,1.0,0,,托料盘上升 (dataDB[15] 字节30) 1=上升 0=下降
/* 注释：定义一条映射记录：name=io.trayUp；address=15；type=UINT；scale=1.0；offset=0；note=托料盘上升 (dataDB[15] 字节30) 1=上升 0=下降。 */
```

**源码第 59 行**

```text
io.blockUp,16,UINT,1.0,0,,阻挡干上升 (dataDB[16] 字节32) 1=上升 0=下降
/* 注释：定义一条映射记录：name=io.blockUp；address=16；type=UINT；scale=1.0；offset=0；note=阻挡干上升 (dataDB[16] 字节32) 1=上升 0=下降。 */
```

**源码第 65 行**

```text
cmd.stop,7,UINT,1.0,0,,停止信号输入 (dataDB[7] 字节14) 写1停止,PLC 自动置0
/* 注释：定义一条映射记录：name=cmd.stop；address=7；type=UINT；scale=1.0；offset=0；note=停止信号输入 (dataDB[7] 字节14) 写1停止。 */
```

**源码第 71 行**

```text
cmd.modeToggle,8,UINT,1.0,0,,手动模式切换 (dataDB[8] 字节16) 1=获取 2=释放,PLC 自动置0
/* 注释：定义一条映射记录：name=cmd.modeToggle；address=8；type=UINT；scale=1.0；offset=0；note=手动模式切换 (dataDB[8] 字节16) 1=获取 2=释放。 */
```

**源码第 75 行**

```text
cmd.start,9,UINT,1.0,0,,启动信号输入 (dataDB[9] 字节18) 写1启动,状态跳0,PLC 自动置0
/* 注释：定义一条映射记录：name=cmd.start；address=9；type=UINT；scale=1.0；offset=0；note=启动信号输入 (dataDB[9] 字节18) 写1启动。 */
```

**源码第 79 行**

```text
cmd.conveyor,10,UINT,1.0,0,,传送带控制 (dataDB[10] 字节20) 1=正转 0=停止,电平型
/* 注释：定义一条映射记录：name=cmd.conveyor；address=10；type=UINT；scale=1.0；offset=0；note=传送带控制 (dataDB[10] 字节20) 1=正转 0=停止。 */
```
