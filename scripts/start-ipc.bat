@echo off
rem 工控机启动包装入口，定位仓库并调用 ipc-recover.ps1。
rem 具体探测、隧道及程序恢复逻辑在被调用的 PowerShell 脚本中；此文件负责传递启动入口。
rem 工控机启动入口。基础服务(MQTT/Redis/PostgreSQL)由 Windows 服务管理。
rem 后端、采集器、SSH 隧道由 ipc-recover.ps1 检查并按需启动。
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ipc-recover.ps1" %*
rem 工控机启动入口。基础服务（MQTT/Redis/PostgreSQL）由 Windows 服务管理。
rem ~dp0ipc-recover.ps1"  是由批处理环境变量提供的当前配置或路径
exit /b %ERRORLEVEL%
rem 后端、采集器、SSH 隧道由 ipc-recover.ps1 检查并按需启动。
rem ERRORLEVEL 是由批处理环境变量提供的当前配置或路径
