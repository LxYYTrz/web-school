# 部署

当前部署目标是原生服务：工控机运行 MQTT Broker、Redis 兼容服务、PostgreSQL/TimescaleDB、NestJS 后端和 PLC 采集器；云服务器运行 Nginx。云服务器只提供静态页面和反向代理，不保存产线数据。

## 工控机

先确保本机的 MQTT `1883`、Redis `6379`、PostgreSQL `5432` 端口就绪，并按顺序执行 `db/init/` 的 SQL。然后在仓库根目录执行：

```powershell
.\scripts\ipc-recover.ps1
.\scripts\test\verify-line.ps1
```

`ipc-recover.ps1` 检查基础服务，按需启动 SSH 隧道、后端和 PLC 采集器。基础服务由 Windows 服务管理；脚本不会安装或启动它们。

## 云服务器

将 `web/dist/` 放到 `/opt/line-twin/deploy/dist/`，把 `deploy/nginx/cloud.conf` 安装到 Nginx 的站点配置目录，再执行 `nginx -t` 和 `systemctl reload nginx`。该配置监听 `8081`，把 `/api/` 和 `/socket.io/` 转发到云服务器本机的 `127.0.0.1:3300`。

工控机主动建立反向隧道：

```bash
ssh -N -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes \
  -R 127.0.0.1:3300:127.0.0.1:3000 user@cloud-host
```

`3300` 只监听云服务器回环地址，不应对公网开放。云端 Nginx 拒绝转发 `/api/machine/`，机器令牌通道只从工控机本机调用。数据库留在工控机本地，不通过隧道转发。若当前线上仍运行旧的容器版 Nginx，必须先迁移 Nginx，再切换隧道绑定地址；两端配置要同时匹配。

## 验证

本机 `http://127.0.0.1:3000/api/lines/line-01/snapshot` 应返回快照。公网 `http://<云服务器>:8081/api/auth/me` 在未登录时应返回 `401`，这也证明 Nginx、隧道和后端均可达。生产证书和 HTTPS 按实际域名配置。
