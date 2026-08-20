# <产品名> Docker 使用说明

> 开发 / 正式环境容器化运行说明。镜像与编排定义见 Dockerfile / docker-compose.yml（及 override）。

## 一、环境要求

- Docker Engine ≥ 20.10（含 Compose v2）
- 端口预留：{入口端口清单}
- {数据卷 / 依赖服务说明}

## 二、快速开始

    # 开发环境（源码挂载 + 热重载）
    cp .env.example .env        # 配置环境变量
    docker compose up           # 或 docker compose -f docker-compose.yml -f docker-compose.override.yml up

    # 生产环境（构建镜像，无源码挂载）
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

## 三、服务清单

| 服务 | 镜像 | 端口（内部/宿主） | 卷 | 说明 |
|------|------|------------------|-----|------|
| {app} | {image} | {port} | {volumes} | 主应用 |
| {db} | mysql:8 | 3306（内部） | {vol} | 数据库，启动自动初始化 |

## 四、环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| {KEY} | ... | {value} |

- `.env.example` 为模板；`.env` 不入库（敏感信息走环境变量，不进镜像）
- 开发 / 正式差异通过 override 文件的 env_file 载入

## 五、日志

- 日志驱动 json-file，单文件 {max-size}、保留 {max-file} 份（轮转配置）
- 查看：`docker compose logs -f {service}`

## 六、资源限制与数据持久化

- 资源限制：cpus/memory 见 compose 的 deploy.resources
- 数据卷：{named volumes}（DB/Redis 数据持久化，容器删除不丢）
- 数据备份：{备份命令/建议}

## 七、数据库初始化（如含 DB 容器）

- 首次启动自动执行 `docker-entrypoint-initdb.d/` 下的 init SQL（来自 docs/specs/data/table.sql）
- 重建：`docker compose down -v`（清空数据卷）后重新 `up`（**慎用，会丢数据**）

## 八、外部调用常用命令

    # 进入运行中容器执行命令
    docker compose exec {app} <命令>

    # 一次性命令（迁移 / seed / CLI）
    docker compose run --rm {app} <命令>

    # 数据库
    docker compose exec {db} mysql -u{user} -p

    # 推荐用 make 封装
    make dev-up / make dev-logs / make test-in-docker

## 九、镜像构建与发布

    docker build -t {registry}/{image}:{tag} .
    docker push {registry}/{image}:{tag}

- tag 策略：{version / commit sha / latest}
- 多阶段构建：builder 阶段装依赖编译，runtime 阶段仅运行产物（distroless/alpine）

## 十、健康检查与故障排查

- 健康检查：{app/db 的 healthcheck 探针与 interval}
- 常见问题：{端口冲突 / 卷权限 / 时区 / 资源不足} 排查要点
