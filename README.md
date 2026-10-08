# 产线数字孪生监控平台(line-twin)

外部网站:机器人六轴实时孪生 · 机器视觉图片展示 · 多角色 RBAC(操作员 / 客户 / 数据分析员)。

## 总体架构

```
产线设备 (PLC / 机器人 / 相机)
   │  Modbus TCP / OPC UA(局域网)
边缘采集器 edge/(工控机,断网本地缓存)
   │  MQTT over TLS(只由边缘主动外连,云端从不连入工厂内网)
云服务器: EMQX → server/ → TimescaleDB · Redis · MinIO
   │  WebSocket / HTTPS
浏览器: web/(Vue3 + Three.js)
```

核心原则:**契约先行** —— `docs/contract/README.md` 是边缘、后端、前端之间唯一的约定。
到现场只需用真实采集器替换 `edge/mock_collector.py`、按映射表填点位,其余代码不动。

## 目录结构

| 目录 | 说明 |
|---|---|
| deploy/ | 基础设施 docker-compose(EMQX / TimescaleDB / Redis / MinIO) |
| db/init/ | 建库建表 DDL + 种子数据(容器首次启动自动执行) |
| docs/contract/ | 数据契约 v1 + 寄存器映射表模板 |
| edge/ | 边缘采集器(当前为 mock 版) |
| server/ | 云端后端(NestJS 骨架:MQTT → TimescaleDB/Redis → WebSocket,见 server/README.md) |
| web/ | 前端(待建,Vue3 + TS + Three.js) |

## 本地起步(开发机)

前置:Docker Desktop · Node.js 20+ · Python 3.11+ · git

```bash
# 1. 起基础设施
docker compose -f deploy/docker-compose.yml up -d

# 2. 验证
#    EMQX Dashboard  http://localhost:18083  (admin / admin123,仅开发默认值)
#    MinIO Console   http://localhost:9001   (minioadmin / minioadmin123)

# 3. 跑 mock 采集器
cd edge
pip install -r requirements.txt
python mock_collector.py

# 4. 用 MQTTX(或 EMQX Dashboard 自带客户端)订阅 tl/v1/# 观察数据流
```

## 开发路线(每步带验收标准)

1. [x] 数据契约 v1 + DDL + 基础设施 + mock 采集器(本仓库)
2. [x] 后端最小链路骨架(server/):订阅 MQTT → 写 TimescaleDB → WebSocket 推送 → Redis 快照
       验收:`curl localhost:3000/api/lines/line-01/snapshot` 有数据;server/tools/ws-test.html 看到实时帧滚动
3. [ ] 前端孪生:Three.js 加载机器人模型(URDF/glTF),关节随数据动 + 插值
       验收:浏览器里机器人跟随 mock 数据运动 —— 第一个"看得见"的里程碑
4. [ ] 登录 + RBAC 三角色(菜单 / 接口 / 字段三级控制)
       验收:三个角色登录看到不同界面,客户调控制接口被拒
5. [ ] 图片链路:上传 → MinIO → 元数据入库 → WS 通知 → 前端展示
6. [ ] 控制链路:指令白名单 + 审计 + MQTT 下行 + ack 回执(mock 已能自动回 ack)
7. [ ] 上云:同一份 compose 部署到云服务器,Nginx + HTTPS;
       安全组只开 443/8883,Dashboard/Console 不对公网;改掉全部默认密码
8. [ ] 到现场:实现 plc 采集器 + 填映射表;先只读稳定后,再逐条放开控制指令
