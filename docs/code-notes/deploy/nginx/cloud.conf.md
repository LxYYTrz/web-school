# deploy/nginx/cloud.conf 逐行说明

[打开源码](../../../../deploy/nginx/cloud.conf) · 55 行 · 42 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 5 | <code>upstream ipc_backend {</code> | 打开 `upstream` 配置块。 |
| 6 | <code>server 127.0.0.1:3300;</code> | 设置 Nginx 指令 `server`。 |
| 7 | <code>keepalive 16;</code> | 设置 Nginx 指令 `keepalive`。 |
| 8 | <code>}</code> | 结束当前配置块。 |
| 10 | <code>server {</code> | 打开 `server` 配置块。 |
| 11 | <code>listen 8081;</code> | 设置 Nginx 指令 `listen`。 |
| 12 | <code>server_name _;</code> | 设置 Nginx 指令 `server_name`。 |
| 14 | <code>root /opt/line-twin/deploy/dist;</code> | 设置 Nginx 指令 `root`。 |
| 15 | <code>index index.html;</code> | 设置 Nginx 指令 `index`。 |
| 16 | <code>server_tokens off;</code> | 设置 Nginx 指令 `server_tokens`。 |
| 18 | <code>location /assets/ {</code> | 打开 `location` 配置块。 |
| 19 | <code>try_files $uri =404;</code> | 设置 Nginx 指令 `try_files`。 |
| 20 | <code>}</code> | 结束当前配置块。 |
| 22 | <code>location ~ /\. {</code> | 打开 `location` 配置块。 |
| 23 | <code>deny all;</code> | 设置 Nginx 指令 `deny`。 |
| 24 | <code>access_log off;</code> | 设置 Nginx 指令 `access_log`。 |
| 25 | <code>}</code> | 结束当前配置块。 |
| 27 | <code>location / {</code> | 打开 `location` 配置块。 |
| 28 | <code>try_files $uri $uri/ /index.html;</code> | 设置 Nginx 指令 `try_files`。 |
| 29 | <code>}</code> | 结束当前配置块。 |
| 32 | <code>location ^~ /api/machine/ {</code> | 打开 `location` 配置块。 |
| 33 | <code>return 403;</code> | 设置 Nginx 指令 `return`。 |
| 34 | <code>}</code> | 结束当前配置块。 |
| 36 | <code>location /api/ {</code> | 打开 `location` 配置块。 |
| 37 | <code>proxy_pass http://ipc_backend;</code> | 设置 Nginx 指令 `proxy_pass`。 |
| 38 | <code>proxy_set_header Host $host;</code> | 设置 Nginx 指令 `proxy_set_header`。 |
| 39 | <code>proxy_set_header X-Real-IP $remote_addr;</code> | 设置 Nginx 指令 `proxy_set_header`。 |
| 40 | <code>proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;</code> | 设置 Nginx 指令 `proxy_set_header`。 |
| 41 | <code>proxy_set_header X-Forwarded-Proto $scheme;</code> | 设置 Nginx 指令 `proxy_set_header`。 |
| 42 | <code>proxy_read_timeout 30s;</code> | 设置 Nginx 指令 `proxy_read_timeout`。 |
| 43 | <code>}</code> | 结束当前配置块。 |
| 45 | <code>location /socket.io/ {</code> | 打开 `location` 配置块。 |
| 46 | <code>proxy_pass http://ipc_backend;</code> | 设置 Nginx 指令 `proxy_pass`。 |
| 47 | <code>proxy_http_version 1.1;</code> | 设置 Nginx 指令 `proxy_http_version`。 |
| 48 | <code>proxy_set_header Upgrade $http_upgrade;</code> | 设置 Nginx 指令 `proxy_set_header`。 |
| 49 | <code>proxy_set_header Connection "upgrade";</code> | 设置 Nginx 指令 `proxy_set_header`。 |
| 50 | <code>proxy_set_header Host $host;</code> | 设置 Nginx 指令 `proxy_set_header`。 |
| 51 | <code>proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;</code> | 设置 Nginx 指令 `proxy_set_header`。 |
| 52 | <code>proxy_read_timeout 3600s;</code> | 设置 Nginx 指令 `proxy_read_timeout`。 |
| 53 | <code>proxy_send_timeout 3600s;</code> | 设置 Nginx 指令 `proxy_send_timeout`。 |
| 54 | <code>}</code> | 结束当前配置块。 |
| 55 | <code>}</code> | 结束当前配置块。 |
