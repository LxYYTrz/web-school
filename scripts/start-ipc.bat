rem 这一段负责调用恢复脚本启动并检查现场运行链路，为后续代码提供当前文件的处理入口。
@echo off
rem 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
rem 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
rem 工控机启动入口。基础服务(MQTT/Redis/PostgreSQL)由 Windows 服务管理。
rem 后端、采集器、SSH 隧道由 ipc-recover.ps1 检查并按需启动。
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ipc-recover.ps1" %*
rem 工控机启动入口。基础服务（MQTT/Redis/PostgreSQL）由 Windows 服务管理。
rem ~dp0ipc-recover.ps1"  是由批处理环境变量提供的当前配置或路径
exit /b %ERRORLEVEL%
rem 后端、采集器、SSH 隧道由 ipc-recover.ps1 检查并按需启动。
rem ERRORLEVEL 是由批处理环境变量提供的当前配置或路径
rem 这一段提供了调用恢复脚本启动并检查现场运行链路所需的定义和处理逻辑，结果交由调用方或运行环境使用。
