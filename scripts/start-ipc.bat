@echo off
rem 关闭批处理命令回显，让输出只显示实际提示。
rem 工控机启动入口。基础服务(MQTT/Redis/PostgreSQL)由 Windows 服务管理。
rem 后端、采集器、SSH 隧道由 ipc-recover.ps1 检查并按需启动。
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ipc-recover.ps1" %*
rem 执行这一行批处理命令。
exit /b %ERRORLEVEL%
rem 执行这一行批处理命令。
