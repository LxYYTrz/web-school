# edge/register-mapping.template.csv 逐行注释

[打开源码](../../../edge/register-mapping.template.csv) · 27 行 · 22 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
name,address,type,scale,offset,unit,note
/* 注释：声明 CSV 列名；后续每行按这些列的顺序解释。 */
```

**源码第 4 行**

```text
robot.joints[0],0,FLOAT32,1.0,0,deg,J1
/* 注释：定义一条映射记录：name=robot.joints[0]；address=0；type=FLOAT32；scale=1.0；offset=0；unit=deg；note=J1。 */
```

**源码第 5 行**

```text
robot.joints[1],2,FLOAT32,1.0,0,deg,J2
/* 注释：定义一条映射记录：name=robot.joints[1]；address=2；type=FLOAT32；scale=1.0；offset=0；unit=deg；note=J2。 */
```

**源码第 6 行**

```text
robot.joints[2],4,FLOAT32,1.0,0,deg,J3
/* 注释：定义一条映射记录：name=robot.joints[2]；address=4；type=FLOAT32；scale=1.0；offset=0；unit=deg；note=J3。 */
```

**源码第 7 行**

```text
robot.joints[3],6,FLOAT32,1.0,0,deg,J4
/* 注释：定义一条映射记录：name=robot.joints[3]；address=6；type=FLOAT32；scale=1.0；offset=0；unit=deg；note=J4。 */
```

**源码第 8 行**

```text
robot.joints[4],8,FLOAT32,1.0,0,deg,J5
/* 注释：定义一条映射记录：name=robot.joints[4]；address=8；type=FLOAT32；scale=1.0；offset=0；unit=deg；note=J5。 */
```

**源码第 9 行**

```text
robot.joints[5],10,FLOAT32,1.0,0,deg,J6
/* 注释：定义一条映射记录：name=robot.joints[5]；address=10；type=FLOAT32；scale=1.0；offset=0；unit=deg；note=J6。 */
```

**源码第 11 行**

```text
robot.tcp[0],12,FLOAT32,1.0,0,mm,x
/* 注释：定义一条映射记录：name=robot.tcp[0]；address=12；type=FLOAT32；scale=1.0；offset=0；unit=mm；note=x。 */
```

**源码第 12 行**

```text
robot.tcp[1],14,FLOAT32,1.0,0,mm,y
/* 注释：定义一条映射记录：name=robot.tcp[1]；address=14；type=FLOAT32；scale=1.0；offset=0；unit=mm；note=y。 */
```

**源码第 13 行**

```text
robot.tcp[2],16,FLOAT32,1.0,0,mm,z
/* 注释：定义一条映射记录：name=robot.tcp[2]；address=16；type=FLOAT32；scale=1.0；offset=0；unit=mm；note=z。 */
```

**源码第 14 行**

```text
robot.tcp[3],18,FLOAT32,1.0,0,deg,rx
/* 注释：定义一条映射记录：name=robot.tcp[3]；address=18；type=FLOAT32；scale=1.0；offset=0；unit=deg；note=rx。 */
```

**源码第 15 行**

```text
robot.tcp[4],20,FLOAT32,1.0,0,deg,ry
/* 注释：定义一条映射记录：name=robot.tcp[4]；address=20；type=FLOAT32；scale=1.0；offset=0；unit=deg；note=ry。 */
```

**源码第 16 行**

```text
robot.tcp[5],22,FLOAT32,1.0,0,deg,rz
/* 注释：定义一条映射记录：name=robot.tcp[5]；address=22；type=FLOAT32；scale=1.0；offset=0；unit=deg；note=rz。 */
```

**源码第 18 行**

```text
robot.speedPct,24,UINT16,1.0,0,%,
/* 注释：定义一条映射记录：name=robot.speedPct；address=24；type=UINT16；scale=1.0；offset=0；unit=%。 */
```

**源码第 19 行**

```text
robot.mode,25,UINT16,1.0,0,,0=manual 1=auto 2=remote 3=error
/* 注释：定义一条映射记录：name=robot.mode；address=25；type=UINT16；scale=1.0；offset=0；note=0=manual 1=auto 2=remote 3=error。 */
```

**源码第 20 行**

```text
robot.program,26,INT16,1.0,0,,PLC 里用 INT 表示程序代号;具体含义看 PLC 程序
/* 注释：定义一条映射记录：name=robot.program；address=26；type=INT16；scale=1.0；offset=0；note=PLC 里用 INT 表示程序代号;具体含义看 PLC 程序。 */
```

**源码第 21 行**

```text
robot.alarmCode,27,UINT16,1.0,0,,0=无报警;非 0=厂商报警码
/* 注释：定义一条映射记录：name=robot.alarmCode；address=27；type=UINT16；scale=1.0；offset=0；note=0=无报警;非 0=厂商报警码。 */
```

**源码第 23 行**

```text
line.state,40,UINT16,1.0,0,,0=offline 1=idle 2=running 3=alarm
/* 注释：定义一条映射记录：name=line.state；address=40；type=UINT16；scale=1.0；offset=0；note=0=offline 1=idle 2=running 3=alarm。 */
```

**源码第 24 行**

```text
line.productCode,41,INT16,1.0,0,,PLC 里用 INT 表示产品代号
/* 注释：定义一条映射记录：name=line.productCode；address=41；type=INT16；scale=1.0；offset=0；note=PLC 里用 INT 表示产品代号。 */
```

**源码第 25 行**

```text
line.goodCount,42,UINT32,1.0,0,pcs,
/* 注释：定义一条映射记录：name=line.goodCount；address=42；type=UINT32；scale=1.0；offset=0；unit=pcs。 */
```

**源码第 26 行**

```text
line.ngCount,44,UINT32,1.0,0,pcs,
/* 注释：定义一条映射记录：name=line.ngCount；address=44；type=UINT32；scale=1.0；offset=0；unit=pcs。 */
```

**源码第 27 行**

```text
line.beatMs,46,UINT16,1.0,0,ms,
/* 注释：定义一条映射记录：name=line.beatMs；address=46；type=UINT16；scale=1.0；offset=0；unit=ms。 */
```
