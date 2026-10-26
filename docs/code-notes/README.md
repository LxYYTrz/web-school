# 项目源码逐行注释

每个文件的说明按原始行号排列：**一行代码，下一行注释**。注释解释该行作用，并就出现的语法关键字写出含义；
全局术语另见[编程关键字速查](keywords.md)。说明文件独立于运行代码，因此 JSON、Vue 模板和构建流程保持有效。

当前覆盖 106 个手写文本文件、6936 行代码。排除 Markdown 文档、依赖锁文件、第三方 wheel、node_modules 和构建产物 dist。

源码变化后运行 `py -3.13 scripts/generate-code-notes.py` 更新行号和说明，再检查具体解释是否准确。

## .claude

- [.claude/skills/codebase-explainer/_meta.json](.claude/skills/codebase-explainer/_meta.json.md)：6 行
- [.claude/skills/lt-push/scripts/push_via_cloud.ps1](.claude/skills/lt-push/scripts/push_via_cloud.ps1.md)：70 行
- [.claude/skills/lt-push/scripts/push_via_cloud.sh](.claude/skills/lt-push/scripts/push_via_cloud.sh.md)：34 行

## .gitignore

- [.gitignore](.gitignore.md)：11 行

## db

- [db/init/001_init.sql](db/init/001_init.sql.md)：164 行
- [db/init/002_app_users.sql](db/init/002_app_users.sql.md)：9 行
- [db/init/003_control_commands_extension.sql](db/init/003_control_commands_extension.sql.md)：5 行
- [db/init/004_line_state_stages.sql](db/init/004_line_state_stages.sql.md)：30 行
- [db/init/005_control_commands_conveyor.sql](db/init/005_control_commands_conveyor.sql.md)：13 行
- [db/init/005_line_state_waiting_robot.sql](db/init/005_line_state_waiting_robot.sql.md)：32 行
- [db/init/006_drop_vision.sql](db/init/006_drop_vision.sql.md)：28 行

## deploy

- [deploy/nginx/cloud.conf](deploy/nginx/cloud.conf.md)：42 行

## docs

- [docs/contract/register-mapping.template.csv](docs/contract/register-mapping.template.csv.md)：14 行

## edge

- [edge/_plc_read11.py](edge/_plc_read11.py.md)：42 行
- [edge/_plc_scan.py](edge/_plc_scan.py.md)：36 行
- [edge/_plc_scan2.py](edge/_plc_scan2.py.md)：51 行
- [edge/_plc_smoke.py](edge/_plc_smoke.py.md)：46 行
- [edge/_test_cmd.py](edge/_test_cmd.py.md)：166 行
- [edge/_test_decode.py](edge/_test_decode.py.md)：158 行
- [edge/mock_collector.py](edge/mock_collector.py.md)：109 行
- [edge/plc_collector.py](edge/plc_collector.py.md)：397 行
- [edge/plc_read_state.py](edge/plc_read_state.py.md)：71 行
- [edge/register-mapping.csv](edge/register-mapping.csv.md)：18 行
- [edge/register-mapping.template.csv](edge/register-mapping.template.csv.md)：22 行
- [edge/requirements.txt](edge/requirements.txt.md)：2 行

## scripts

- [scripts/generate-code-notes.py](scripts/generate-code-notes.py.md)：655 行
- [scripts/ipc-recover.ps1](scripts/ipc-recover.ps1.md)：111 行
- [scripts/start-ipc.bat](scripts/start-ipc.bat.md)：3 行
- [scripts/start-local.bat](scripts/start-local.bat.md)：25 行
- [scripts/tunnel-keepalive.ps1](scripts/tunnel-keepalive.ps1.md)：91 行
- [scripts/verify-line.ps1](scripts/verify-line.ps1.md)：78 行

## server

- [server/.env.example](server/.env.example.md)：17 行
- [server/mcp/line-twin-mcp.js](server/mcp/line-twin-mcp.js.md)：571 行
- [server/package.json](server/package.json.md)：42 行
- [server/src/ai/ai.controller.ts](server/src/ai/ai.controller.ts.md)：78 行
- [server/src/ai/ai.module.ts](server/src/ai/ai.module.ts.md)：12 行
- [server/src/ai/ai.service.ts](server/src/ai/ai.service.ts.md)：139 行
- [server/src/ai/proposal.service.ts](server/src/ai/proposal.service.ts.md)：85 行
- [server/src/app.module.ts](server/src/app.module.ts.md)：24 行
- [server/src/auth/auth.controller.ts](server/src/auth/auth.controller.ts.md)：33 行
- [server/src/auth/auth.guard.ts](server/src/auth/auth.guard.ts.md)：13 行
- [server/src/auth/auth.module.ts](server/src/auth/auth.module.ts.md)：11 行
- [server/src/auth/auth.service.ts](server/src/auth/auth.service.ts.md)：27 行
- [server/src/auth/current-user.decorator.ts](server/src/auth/current-user.decorator.ts.md)：10 行
- [server/src/auth/dto/login.dto.ts](server/src/auth/dto/login.dto.ts.md)：9 行
- [server/src/auth/session-user.ts](server/src/auth/session-user.ts.md)：4 行
- [server/src/auth/users-bootstrap.service.ts](server/src/auth/users-bootstrap.service.ts.md)：38 行
- [server/src/command/command-contract.json](server/src/command/command-contract.json.md)：31 行
- [server/src/command/command-contract.ts](server/src/command/command-contract.ts.md)：17 行
- [server/src/command/command.controller.ts](server/src/command/command.controller.ts.md)：19 行
- [server/src/command/command.guard.ts](server/src/command/command.guard.ts.md)：13 行
- [server/src/command/command.module.ts](server/src/command/command.module.ts.md)：14 行
- [server/src/command/command.service.ts](server/src/command/command.service.ts.md)：94 行
- [server/src/command/machine-command.controller.ts](server/src/command/machine-command.controller.ts.md)：28 行
- [server/src/command/machine-token.guard.ts](server/src/command/machine-token.guard.ts.md)：41 行
- [server/src/config/configuration.ts](server/src/config/configuration.ts.md)：36 行
- [server/src/history/history-writer.service.ts](server/src/history/history-writer.service.ts.md)：135 行
- [server/src/history/history.module.ts](server/src/history/history.module.ts.md)：4 行
- [server/src/infra/catalog.service.ts](server/src/infra/catalog.service.ts.md)：38 行
- [server/src/infra/infra.module.ts](server/src/infra/infra.module.ts.md)：16 行
- [server/src/infra/tokens.ts](server/src/infra/tokens.ts.md)：2 行
- [server/src/ingest/ingest.module.ts](server/src/ingest/ingest.module.ts.md)：11 行
- [server/src/ingest/mqtt-ingest.service.ts](server/src/ingest/mqtt-ingest.service.ts.md)：99 行
- [server/src/main.ts](server/src/main.ts.md)：26 行
- [server/src/realtime/realtime.module.ts](server/src/realtime/realtime.module.ts.md)：11 行
- [server/src/realtime/snapshot.controller.ts](server/src/realtime/snapshot.controller.ts.md)：10 行
- [server/src/realtime/telemetry.gateway.ts](server/src/realtime/telemetry.gateway.ts.md)：41 行
- [server/src/state/line-state.service.ts](server/src/state/line-state.service.ts.md)：55 行
- [server/src/state/state.module.ts](server/src/state/state.module.ts.md)：4 行
- [server/src/types/express.d.ts](server/src/types/express.d.ts.md)：14 行
- [server/src/users/dto/create-user.dto.ts](server/src/users/dto/create-user.dto.ts.md)：11 行
- [server/src/users/dto/update-user.dto.ts](server/src/users/dto/update-user.dto.ts.md)：10 行
- [server/src/users/users.controller.ts](server/src/users/users.controller.ts.md)：32 行
- [server/src/users/users.module.ts](server/src/users/users.module.ts.md)：11 行
- [server/src/users/users.service.ts](server/src/users/users.service.ts.md)：97 行
- [server/tools/ws-test.html](server/tools/ws-test.html.md)：33 行
- [server/tsconfig.json](server/tsconfig.json.md)：19 行

## web

- [web/.env.example](web/.env.example.md)：1 行
- [web/.env.production](web/.env.production.md)：1 行
- [web/index.html](web/index.html.md)：12 行
- [web/package.json](web/package.json.md)：28 行
- [web/src/App.vue](web/src/App.vue.md)：108 行
- [web/src/components/AiDrawer.vue](web/src/components/AiDrawer.vue.md)：259 行
- [web/src/components/ControlButtons.vue](web/src/components/ControlButtons.vue.md)：220 行
- [web/src/components/IoPanel.vue](web/src/components/IoPanel.vue.md)：155 行
- [web/src/composables/useLineData.ts](web/src/composables/useLineData.ts.md)：136 行
- [web/src/main.ts](web/src/main.ts.md)：14 行
- [web/src/router/index.ts](web/src/router/index.ts.md)：36 行
- [web/src/services/ai.ts](web/src/services/ai.ts.md)：97 行
- [web/src/services/auth.ts](web/src/services/auth.ts.md)：48 行
- [web/src/services/control.ts](web/src/services/control.ts.md)：46 行
- [web/src/services/ioPoints.ts](web/src/services/ioPoints.ts.md)：60 行
- [web/src/services/lineState.ts](web/src/services/lineState.ts.md)：93 行
- [web/src/services/socket.ts](web/src/services/socket.ts.md)：20 行
- [web/src/services/types.ts](web/src/services/types.ts.md)：86 行
- [web/src/stores/auth.ts](web/src/stores/auth.ts.md)：42 行
- [web/src/styles.css](web/src/styles.css.md)：84 行
- [web/src/three/RobotArm.ts](web/src/three/RobotArm.ts.md)：132 行
- [web/src/three/SceneManager.ts](web/src/three/SceneManager.ts.md)：84 行
- [web/src/views/IoView.vue](web/src/views/IoView.vue.md)：122 行
- [web/src/views/LoginView.vue](web/src/views/LoginView.vue.md)：118 行
- [web/src/views/TwinView.vue](web/src/views/TwinView.vue.md)：112 行
- [web/src/views/UsersView.vue](web/src/views/UsersView.vue.md)：167 行
- [web/src/vite-env.d.ts](web/src/vite-env.d.ts.md)：1 行
- [web/tsconfig.json](web/tsconfig.json.md)：18 行
- [web/vite.config.ts](web/vite.config.ts.md)：12 行
