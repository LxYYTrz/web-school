# 工控机部署手册(U盘人工版 · 本地闭环)

<!--
  ============================================================================
  文件作用：【给现场部署人员的人工操作手册】（U 盘离线安装版）
  所属模块：docs/
  ============================================================================

  【适用场景】
    工控机是 Windows、**没有外网**、不装 Docker、不连云服务器，
    只想在工控机本机把整套系统跑起来看实时画面。

  【与其它文档的区别】
    docs/deploy-guide.md     → 云端 + 工控机的正式部署（含 SSH 隧道）
    docs/deployment.md       → 架构定稿与拓扑
    本文档                    → ★ 只管"把这台 Windows 机器装起来"

  【核心思路】
    开发机把所有依赖都装好打成部署包（≈270MB，含 node_modules / dist /
    Python 离线 wheel / 预置 .env），U 盘拷到工控机 → 解压 → 装 6 个
    Windows 软件 → 执行 3 条 SQL → 双击 start-local.bat → 完事。

  【章节速览】
    §0  总览（部署完工控机上有什么）
    §1  准备 U 盘（6 个安装包 + 部署包）
    §2  装环境（Node / Python / Mosquitto / Memurai / PG / TimescaleDB）
    §3  放代码 + 初始化数据库（执行 001_init.sql）
    §4  装 Python 依赖（离线 wheels）
    §5  启动（双击 scripts\start-local.bat）+ 三项验收
    §6  常见问题
    §7  以后更新代码（开发机 → U盘 → 工控机）
    附录A 不用预打包时（源码 zip + 联网装依赖）
  ============================================================================
-->

目标:在产线工控机上把 line-twin 跑起来,本机浏览器看实时画面(mock 数据)。
**不用 Docker、不用云服务器、不用 SSH 隧道、工控机全程无需联网**(部署包已内置全部依赖)。

## 0. 总览

部署完成后,工控机上有:

| 类别 | 内容 | 启动方式 |
|---|---|---|
| 3 个 Windows 服务(装完不用管) | Mosquitto(MQTT,1883)· Memurai(Redis,6379)· PostgreSQL+TimescaleDB(5432) | 开机自启 |
| 1 份代码 | `D:\line-twin`(部署包解压,含 node_modules / dist / 离线依赖) | U盘拷入,一次 |
| 3 个进程 | 后端(3000)· mock 采集器 · 前端(5173) | 双击 `scripts\start-local.bat` |

前置条件:工控机为 Windows 10/11 x64,有管理员权限。

---

## 1. 准备 U盘(在一台能上网的电脑上)

### 1.1 下载 6 个安装包,放进 U盘 `installers\` 文件夹

| # | 软件 | 下载页面 | 选哪个文件 |
|---|---|---|---|
| 1 | Node.js 20 LTS | https://nodejs.org/zh-cn/download | Windows Installer (.msi) → x64 |
| 2 | Python 3.12 | https://www.python.org/downloads/windows/ | Windows installer (64-bit) |
| 3 | Mosquitto | https://mosquitto.org/download/ | mosquitto-*-install-windows-x64.exe |
| 4 | Memurai Developer | https://www.memurai.com/get-memurai | Developer(免费版)→ .msi |
| 5 | PostgreSQL 16 | https://www.enterprisedb.com/downloads/postgres-postgresql-downloads | Windows x86-64,**16.6 或更新(不要 16.5)** |
| 6 | TimescaleDB | https://github.com/timescale/timescaledb/releases | 最新版的 Windows 资产(.zip);找不到就看 https://docs.timescale.com/self-hosted/latest/install/installation-windows/ |

### 1.2 拷贝部署包

把开发机打好的 **`产线web-工控机部署包.zip`**(约 270MB,已内置后端编译产物、全部 npm 依赖、Python 离线依赖包、预置配置文件)放 U盘根目录。

### 1.3 出发前核对

- [ ] `installers\` 下 6 个安装包
- [ ] `产线web-工控机部署包.zip`
- [ ] 本手册(打印或手机拍照)

---

## 2. 装环境(工控机,约 40 分钟)

### 2.1 Node.js

运行 `node-v20.x-x64.msi`,一路 Next。
**验收**:新开 cmd 执行 `node -v` → 显示 `v20.x.x`

### 2.2 Python

运行 `python-3.12.x-amd64.exe`,**先勾选 "Add python.exe to PATH"**,再点 Install Now。
**验收**:新开 cmd 执行 `python --version` → `Python 3.12.x`

### 2.3 Mosquitto(MQTT broker,替代 EMQX)

1. 运行 `mosquitto-*-install-windows-x64.exe`,默认选项装完(含 Windows 服务)。
2. 以**管理员身份**用记事本打开 `C:\Program Files\mosquitto\mosquitto.conf`,在**文件末尾**追加两行:

   ```
   listener 1883 127.0.0.1
   allow_anonymous true
   ```

   (含义:只监听本机回环、允许匿名——对齐项目开发默认值,厂区局域网内其他机器连不上。)
3. 管理员 cmd 重启服务:`net stop mosquitto && net start mosquitto`

**验收**:`netstat -ano | findstr :1883` 看到 `127.0.0.1:1883 ... LISTENING`

### 2.4 Memurai(Redis 替代)

运行 `.msi`,默认选项装完。
**验收**:services.msc 里 Memurai 正在运行;或 `netstat -ano | findstr :6379` 有 LISTENING

### 2.5 PostgreSQL 16

运行 `postgresql-16.x-windows-x64.exe`:

- **Password: `postgres123`**(本地闭环统一口令,部署包内的 `server\.env` 已按此预置;以后上云前再改)
- Port: `5432`(默认)
- 其余默认;装完取消勾选 Stack Builder。

**验收**:services.msc 里 postgresql-x64-16 正在运行

### 2.6 TimescaleDB 扩展

1. 解压 TimescaleDB 的 zip,右键 `setup.exe` → 以管理员身份运行。
2. 它会发现 PostgreSQL 16,按提示继续;问到是否自动修改 `postgresql.conf`(shared_preload_libraries)选 Yes。
3. 装完重启 PG 服务:`net stop postgresql-x64-16 && net start postgresql-x64-16`

**验收**:下一步 3.2 的 SQL 能无错执行,即为本步成功。

---

## 3. 放代码 + 初始化数据库

### 3.1 解压部署包

解压 `产线web-工控机部署包.zip`,把得到的文件夹**移动并重命名为 `D:\line-twin`**。
(没有 D 盘就用 `C:\line-twin`;**路径不要带中文和空格**。)

**验收**:`D:\line-twin` 下有 `server`、`web`、`edge`、`db`、`docs`、`scripts`,且 `server\dist\main.js`、`server\.env` 存在

### 3.2 初始化数据库

数据库在**本机**(PostgreSQL 16 + TimescaleDB),云端不存数据。

管理员 cmd 逐条执行:

```bat
set PGPASSWORD=postgres123
set PSQL="C:\Program Files\PostgreSQL\16\bin\psql.exe"
%PSQL% -U postgres -c "CREATE DATABASE linetwin;"
:: 按文件名顺序把 db\init\ 下所有 .sql 跑一遍(001 建表 → 002~006 迁移)
for %%F in (D:\line-twin\db\init\*.sql) do %PSQL% -U postgres -d linetwin -f "%%F"
%PSQL% -U postgres -d linetwin -c "SELECT code FROM production_lines;"
```

**验收**:无 `ERROR` 字样;最后一条查询显示 `line-01`

> ⚠ 上面的 for 循环是**全新安装**用的(空库)。存量库已经有表了,重跑 001 会报
> "relation already exists" —— 存量库只补跑缺失的迁移文件(002~006)即可。

---

## 4. 装采集器依赖(离线,10 秒)

部署包已内置 node 依赖与配置文件,只剩 Python 一个包:

```bat
python -m pip install --no-index --find-links=D:\line-twin\edge\wheels paho-mqtt
```

**验收**:显示 `Successfully installed paho-mqtt-2.x.x`

(`server\.env` 已预置好,**不需要改任何配置**:PG 密码 postgres123,MQTT/Redis 都在本机默认端口。)

---

## 5. 启动(以后每次开机只需做这步)

双击 **`D:\line-twin\scripts\start-local.bat`** → 弹出 3 个窗口(lt-server / lt-edge / lt-web)。
Windows 防火墙弹窗全部选"允许"(勾专用网络即可)。

### 验收(三项全过才算成功)

1. 新开 cmd:`curl http://localhost:3000/api/lines/line-01/snapshot` → 返回 JSON 且 `robots` 非空
2. 浏览器打开 `http://localhost:5173` → 机械臂在动、良品计数在跳、顶栏"边缘在线"为绿色
3. lt-edge 窗口有数据滚动;lt-server 窗口无红色报错

---

## 6. 常见问题

| 现象 | 处理 |
|---|---|
| server 窗口报 `password authentication failed` | 装 PG 时密码不是 postgres123 → 改 `D:\line-twin\server\.env` 里 `DATABASE_URL` 的密码,重启 server 窗口 |
| 3.2 报 `CREATE EXTENSION` 失败 | TimescaleDB 没装好,或 PG 版本是 16.5 → 重做 2.6(PG 换 16.6+) |
| `'psql' 不是内部或外部命令` | 用 3.2 里的全路径写法 |
| 浏览器打不开 5173 | 看 lt-web 窗口是否还在运行;vite 首次启动等 5~10 秒 |
| 某端口被占用 | `netstat -ano | findstr :端口号` 找 PID,任务管理器结束它 |

---

## 7. 以后更新代码(开发机 → U盘 → 工控机)

| 改了什么 | U盘拷什么 | 工控机上的操作 |
|---|---|---|
| `server\src` | `server\dist`(开发机先 `npm run build`) | 覆盖后关掉 lt-server 窗口重开 |
| `web\src` | `web\src` | 不用动,vite 热更新自动生效 |
| 新增/升级 npm 依赖 | 对应的整个 `node_modules` | 不用动 |
| `edge` 脚本 | `edge\` 目录 | 重启 lt-edge 窗口 |
| `001_init.sql` | `db\init\` | 重跑 3.2(注意:会清掉历史数据) |

绝大多数时候只需拷 `server\dist` + `web\src` 两个小目录。

---

## 附录 A:不用预打包包时(源码 zip + 工控机在线装依赖)

如果拿的是 GitHub 源码 zip(`https://github.com/LxYYTrz/web-school/archive/refs/heads/line-twin.zip`)而非预打包包,则第 4 步替换为以下流程(工控机需联网,约 5~10 分钟):

```bat
cd /d D:\line-twin\server
npm install
npm run build
copy .env.example .env
cd /d D:\line-twin\web
npm install
python -m pip install paho-mqtt
```

npm 太慢先执行:`npm config set registry https://registry.npmmirror.com`,再重来。
**验收**:`dir D:\line-twin\server\dist\main.js` 文件存在;各步无 `error` 字样。
