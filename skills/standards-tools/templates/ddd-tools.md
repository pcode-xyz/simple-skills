# DDD · 工具层（infra 实现层）（prompt 模板）

## prompt 模板

    你是一位资深后端架构师，精通{语言}和 DDD（领域驱动设计）。请你基于项目信息，遵守架构原则，
    在此基础上说明工具层（基础设施层 infra）的组织方式，并输出至 docs/standards/。

    ## 项目信息

    请阅读以下文件：
    - 业务流程描述：docs/product/business-flow.md
    - DB 设计文件：docs/specs/data/（table.sql 或 schema.json）
    - 一个示例 API：docs/specs/API/<模块>.yaml（选一个代表性接口）
    - 技术选型：docs/standards/tech-stack-rule.md
    - 目录结构：docs/standards/directory-rule.md
    - Handler 流转流程：docs/standards/http-handler-rule.md

    ## 架构原则（工具层相关）

    项目采用 DDD 四层整洁架构，工具层即**基础设施层 infra**：
    1. **infra 实现 domain/application 接口**：仓储实现、外部服务、db/queue/llm 等都在 infra，domain 只定义接口
    2. **Contract/Impl 分离**：infra 内部接口定义（contract）与具体实现（impl）分开
    3. **依赖倒置**：业务（application/domain）面向接口，具体实现在 infra，通过 DI 注入
    4. **限界上下文内聚**：工具按所属上下文组织，跨上下文共享的放公共 infra
    5. 严格 TDD

    ## 输出要求

    1. infra 层的完整包/目录结构（contract/ 与 impl/、按限界上下文划分）
    2. 每个工具的接口（contract）与实现（impl）：db、queue、llm、外部服务等
    3. domain 定义的接口与 infra 实现的对应关系表
    4. 以一个业务用例（用示例 API）为例，标注 application 如何通过接口调用 infra（依赖倒置 + DI 注入点）
    5. 组件初始化与注入方式（DI 容器/启动装配）
