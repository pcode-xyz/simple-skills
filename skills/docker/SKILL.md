---
name: docker
description: 基于技术架构用 Docker 承载开发/正式环境（执行型，会写配置文件）。读 tech-stack-rule（语言/框架/DB/Redis/队列）确认技术栈，询问是否含数据库/依赖容器，生成 Dockerfile（多阶段构建）、docker-compose.yml（+ dev/prod override）、.dockerignore、readme-docker.md（项目根）。覆盖日志轮转、CPU/内存限制、数据卷挂载、dev/prod 配置载入、外部命令调用、健康检查、重启策略、DB 初始化。当用户要做容器化部署、Dockerfile、docker-compose、Docker 环境时使用。
---

# docker

基于技术架构，用 Docker 作为开发 / 正式环境的载体，完成容器化定义。**执行型——会写配置文件。**

> 主流程读技术栈 + 与用户确认范围后直接生成，无需 subagent。

## 前置依赖（先检查，缺失就停）

- 必须存在：`docs/standards/tech-stack-rule.md`（语言/框架/DB/Redis/队列/构建命令）。
- 建议存在：`docs/standards/directory-rule.md`（服务目录）、`docs/specs/data/`（DB 初始化 SQL）、`docs/standards/tools-rule.md`。
- 缺失必选项时，提示先运行对应 skill（architecture），结束。

## Step 1 — 读技术栈，确认范围

- `tech-stack-rule.md`：语言/框架（决定 Dockerfile 形态与基础镜像）、DB/Redis/队列（依赖服务）、构建命令。
- 确认目标项目根（默认当前工作目录）。

## Step 2 — 询问容器范围（AskUserQuestion）

- **是否含数据库容器**？是 → 需定义 DB 初始化（挂载 init SQL，来自 `docs/specs/data/table.sql` 或 do-db 产出）。
- 其他依赖服务（Redis / 队列等）是否一并容器化？（按 tech-stack-rule 的中间件选型）
- 是否需要 dev/prod 两套配置（compose override）？

## Step 3 — 生成容器化定义（按 tech-stack-rule，遵循所选语言最佳实践）

产出到目标项目根：

1. **Dockerfile**：
   - **多阶段构建**：builder 阶段装依赖编译，runtime 阶段只含运行产物（基础镜像选轻量：Go → distroless/alpine、Node → alpine、Rust → distroless、Python → slim）
   - **非 root 用户**运行（安全）；启动前跑迁移（entrypoint 内 migrate 再起服务）；CMD 启动命令按框架
2. **docker-compose.yml**：
   - 服务：应用 + 依赖（DB/Redis/队列，按确认范围）
   - **内部网络**：依赖服务不暴露宿主端口，只暴露应用入口
   - **健康检查**：app/db 的 healthcheck 探针；依赖服务用 `depends_on + condition: service_healthy` 控制启动顺序
   - **重启策略**：`restart: unless-stopped`（或 on-failure）
   - **日志**：logging driver json-file + `max-size`（如 10m）+ `max-file`（如 5），轮转
   - **资源限制**：`deploy.resources.limits`（cpus/memory）按服务分配
   - **数据卷**：命名卷持久化 DB/Redis 数据；上传/日志目录卷；**开发卷挂载源码**（热重载）
   - **环境配置**：`env_file` + `.env`（提供 `.env.example` 模板；敏感信息走环境变量不入镜像）
   - **时区** TZ 环境变量
3. **docker-compose.override.yml（开发）/ docker-compose.prod.yml（正式）**：dev 挂源码 + 热重载；prod 构建镜像无源码挂载、用正式配置
4. **.dockerignore**：排除 .git / node_modules / 构建产物 / 日志 / .env
5. **数据库初始化**（若含 DB 容器）：把 `docs/specs/data/table.sql`（或 do-db 产物）作为 init SQL 挂载到 `docker-entrypoint-initdb.d/`，首次启动自动建表
6. **readme-docker.md**（项目根，按 `templates/docker-readme-template.md`）：环境要求 / 快速开始 / 服务清单 / 环境变量 / 日志 / 资源与卷 / DB 初始化 / **外部调用常用命令**（docker compose exec / run --rm / make 封装）/ 镜像构建与发布 / 健康检查与故障排查

## Step 4 — 完成后

- 报告：生成的文件清单（Dockerfile / compose / override / .dockerignore / readme-docker.md）、含哪些依赖容器、DB 初始化方式。
- 提示：可 `docker compose up` 验证，或调整资源限制/端口映射。
