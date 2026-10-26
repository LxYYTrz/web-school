# deploy/nginx/cloud.conf 逐行注释

[打开源码](../../../../deploy/nginx/cloud.conf) · 55 行 · 42 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 5 行**

```text
upstream ipc_backend {
# 注释：打开 `upstream` 配置块。
```

**源码第 6 行**

```text
    server 127.0.0.1:3300;
# 注释：设置 Nginx 指令 `server`。
```

**源码第 7 行**

```text
    keepalive 16;
# 注释：设置 Nginx 指令 `keepalive`。
```

**源码第 8 行**

```text
}
# 注释：结束当前配置块。
```

**源码第 10 行**

```text
server {
# 注释：打开 `server` 配置块。
```

**源码第 11 行**

```text
    listen 8081;
# 注释：设置 Nginx 指令 `listen`。
```

**源码第 12 行**

```text
    server_name _;
# 注释：设置 Nginx 指令 `server_name`。
```

**源码第 14 行**

```text
    root /opt/line-twin/deploy/dist;
# 注释：设置 Nginx 指令 `root`。
```

**源码第 15 行**

```text
    index index.html;
# 注释：设置 Nginx 指令 `index`。
```

**源码第 16 行**

```text
    server_tokens off;
# 注释：设置 Nginx 指令 `server_tokens`。
```

**源码第 18 行**

```text
    location /assets/ {
# 注释：打开 `location` 配置块。
```

**源码第 19 行**

```text
        try_files $uri =404;
# 注释：设置 Nginx 指令 `try_files`。
```

**源码第 20 行**

```text
    }
# 注释：结束当前配置块。
```

**源码第 22 行**

```text
    location ~ /\. {
# 注释：打开 `location` 配置块。
```

**源码第 23 行**

```text
        deny all;
# 注释：设置 Nginx 指令 `deny`。
```

**源码第 24 行**

```text
        access_log off;
# 注释：设置 Nginx 指令 `access_log`。
```

**源码第 25 行**

```text
    }
# 注释：结束当前配置块。
```

**源码第 27 行**

```text
    location / {
# 注释：打开 `location` 配置块。
```

**源码第 28 行**

```text
        try_files $uri $uri/ /index.html;
# 注释：设置 Nginx 指令 `try_files`。
```

**源码第 29 行**

```text
    }
# 注释：结束当前配置块。
```

**源码第 32 行**

```text
    location ^~ /api/machine/ {
# 注释：打开 `location` 配置块。
```

**源码第 33 行**

```text
        return 403;
# 注释：设置 Nginx 指令 `return`。 关键字：return＝结束函数并返回结果。
```

**源码第 34 行**

```text
    }
# 注释：结束当前配置块。
```

**源码第 36 行**

```text
    location /api/ {
# 注释：打开 `location` 配置块。
```

**源码第 37 行**

```text
        proxy_pass http://ipc_backend;
# 注释：设置 Nginx 指令 `proxy_pass`。
```

**源码第 38 行**

```text
        proxy_set_header Host $host;
# 注释：设置 Nginx 指令 `proxy_set_header`。
```

**源码第 39 行**

```text
        proxy_set_header X-Real-IP $remote_addr;
# 注释：设置 Nginx 指令 `proxy_set_header`。
```

**源码第 40 行**

```text
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
# 注释：设置 Nginx 指令 `proxy_set_header`。
```

**源码第 41 行**

```text
        proxy_set_header X-Forwarded-Proto $scheme;
# 注释：设置 Nginx 指令 `proxy_set_header`。
```

**源码第 42 行**

```text
        proxy_read_timeout 30s;
# 注释：设置 Nginx 指令 `proxy_read_timeout`。
```

**源码第 43 行**

```text
    }
# 注释：结束当前配置块。
```

**源码第 45 行**

```text
    location /socket.io/ {
# 注释：打开 `location` 配置块。
```

**源码第 46 行**

```text
        proxy_pass http://ipc_backend;
# 注释：设置 Nginx 指令 `proxy_pass`。
```

**源码第 47 行**

```text
        proxy_http_version 1.1;
# 注释：设置 Nginx 指令 `proxy_http_version`。
```

**源码第 48 行**

```text
        proxy_set_header Upgrade $http_upgrade;
# 注释：设置 Nginx 指令 `proxy_set_header`。
```

**源码第 49 行**

```text
        proxy_set_header Connection "upgrade";
# 注释：设置 Nginx 指令 `proxy_set_header`。
```

**源码第 50 行**

```text
        proxy_set_header Host $host;
# 注释：设置 Nginx 指令 `proxy_set_header`。
```

**源码第 51 行**

```text
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
# 注释：设置 Nginx 指令 `proxy_set_header`。
```

**源码第 52 行**

```text
        proxy_read_timeout 3600s;
# 注释：设置 Nginx 指令 `proxy_read_timeout`。
```

**源码第 53 行**

```text
        proxy_send_timeout 3600s;
# 注释：设置 Nginx 指令 `proxy_send_timeout`。
```

**源码第 54 行**

```text
    }
# 注释：结束当前配置块。
```

**源码第 55 行**

```text
}
# 注释：结束当前配置块。
```
