# DDD + 整洁架构（参考规格）

> 来源：用户补充资料。示例以 NestJS 呈现；落地时按所选后端语言映射（原则不变，技术替换）。

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

## 对技术选型的影响（选型 prompt 注入用）

- **ORM / 数据访问**：能实现仓储模式、把领域与基础设施解耦的方案（TypeORM/Prisma/GORM/ent 等按语言）
- **依赖注入**：框架需支持 DI 以实现依赖倒置（NestJS 内置 DI；Go 用 wire/fx/dig；Rust 用 shaku 等）
- **测试框架**：TDD 需要测试框架与依赖隔离（NestJS/Jest 或 Vitest；Go 标准 testing + testify；Rust cargo test）
- **工程结构**：目录按 api/application/domain/infra + 限界上下文组织

## 输出要求（完整 DDD 架构设计阶段用，技术选型阶段不执行）

1. 给出完整的项目目录结构（树形展示）
2. 以一个核心限界上下文（如 conversation）为例，展示各层的典型代码结构：
   - domain 层的实体定义、仓储接口、领域服务接口
   - application 层的应用服务（UseCase）
   - api 层的 Controller + DTO
   - infra 层的仓储实现
3. 说明依赖注入（DI）如何实现依赖倒置
4. 给出一个完整请求从 Controller 到数据库的流转路径
