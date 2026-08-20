# 面向对象三层架构 · 工具层（DAO + 公共工具）（prompt 模板）

## prompt 模板

    你是一位资深后端工程师，精通{语言}和面向对象设计。请你基于项目信息，遵守架构原则，
    在此基础上说明工具层的组织方式，并输出至 docs/standards/。

    ## 项目信息

    请阅读以下文件：
    - 业务流程描述：docs/product/business-flow.md
    - DB 设计文件：docs/specs/data/（table.sql 或 schema.json）
    - 一个示例 API：docs/specs/API/<模块>.yaml（选一个代表性接口）
    - 技术选型：docs/standards/tech-stack-rule.md
    - 目录结构：docs/standards/directory-rule.md
    - Handler 流转流程：docs/standards/http-handler-rule.md

    ## 架构原则（工具层相关）

    项目采用三层架构（表现层 / 业务层 / 数据访问层），工具层 = 数据访问层 + 公共工具层：
    1. **数据访问层（dao）**：数据库增删改查，接口 + 实现分离（XxxDao / XxxDaoImpl）
    2. **公共工具层（common/util）**：日志、连接、通用工具类，供各层调用
    3. **业务层通过 DAO 接口访问数据**，事务在业务层（service）
    4. **实体对象作数据载体**：各层间传 entity，与 API DTO 分离
    5. 依赖方向：上层调用下层，通过接口解耦

    ## 输出要求

    1. 工具层完整目录结构（dao(+impl)/、common/ 下的各工具组件 log/db/util 等）
    2. 每个组件的对外接口与职责
    3. 以一个业务 Service（用示例 API）为例，标注它如何调用 DAO 与公共工具（依赖注入方式）
    4. 工具层与表现层/业务层的边界
    5. 组件初始化与注入方式
