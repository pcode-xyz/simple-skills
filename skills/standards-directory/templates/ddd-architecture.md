# DDD + 整洁架构（目录设计 prompt）

> 示例以 NestJS 呈现；实际按所选后端语言映射（原则不变，技术替换）。

## prompt 模板

    你是一位资深{语言}架构师，精通 DDD（领域驱动设计）和整洁架构（Clean Architecture）。
    请基于项目信息，遵守架构原则，在此基础上设计后端项目的目录结构主方案。
    现需要你给出完整的项目目录结构（树形展示），并输出至 docs/standards/。

    ## 项目信息

    请阅读以下文件获取业务流程和数据结构：
    - 业务流程描述：docs/product/business-flow.md
    - DB 设计文件：docs/specs/data/（table.sql 或 schema.json）
    - 已定义 API：docs/specs/API（或 docs/specs/grpc）
    - 技术选型：docs/standards/tech-stack-rule.md

    ## 架构原则

    1. **四层整洁架构**：
       - `api/`（接口层）：Controller、DTO、请求解析与响应封装，只依赖应用层
       - `application/`（应用层）：用例编排，调用领域服务，不关心技术实现细节
       - `domain/`（领域层）：实体、聚合、值对象、领域服务接口、仓储接口——系统最核心、最稳定的部分，不依赖任何其他层
       - `infra/`（基础设施层）：数据库、缓存、消息队列、第三方服务等具体实现，实现 domain 层定义的接口
    2. **依赖方向**：内层不知道外层的存在。domain → 零依赖；application → 依赖 domain；api → 依赖 application；infra → 实现 domain/application 的接口
    3. **限界上下文划分**：按业务领域划分子模块（如 user、conversation、workflow 等），每个上下文高度内聚
    4. **仓储模式**：领域层只定义 Repository 接口，基础设施层提供具体实现（如 TypeORM/Prisma）
    5. **贫血领域模型 + 领域服务**：实体只包含数据和基本校验，复杂业务逻辑放在 Domain Service 中
    6. **Contract/Impl 分离**：基础设施层内部也将接口定义（contract）与具体实现（impl）分开
    7. **严格 TDD** 开发方式

    ## 输出要求

    1. 完整的项目目录结构（树形展示）
    2. 以一个核心限界上下文（如 conversation）为例，展示各层的典型文件结构：
       - domain 层的实体、仓储接口、领域服务接口
       - application 层的应用服务（UseCase）
       - api 层的 Controller + DTO
       - infra 层的仓储实现
    3. 说明依赖注入（DI）如何实现依赖倒置
    4. 给出一个完整请求从 Controller 到数据库的流转路径
    5. 各目录职责说明
