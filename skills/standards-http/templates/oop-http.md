# 面向对象三层架构 · HTTP 请求流转（prompt 模板）

## prompt 模板

    你是一位资深后端工程师，精通{语言}和面向对象设计。请你基于项目信息，遵守架构原则，
    在此基础上给出一个完整请求从表现层到数据库的流转路径，并输出至 docs/standards/。

    ## 项目信息

    请阅读以下文件获取业务流程、数据结构、技术选型：
    - 业务流程描述：docs/product/business-flow.md
    - DB 设计文件：docs/specs/data/（table.sql 或 schema.json）
    - 一个示例 API：docs/specs/API/<模块>.yaml（选一个代表性接口）
    - 技术选型：docs/standards/tech-stack-rule.md
    - 目录结构：docs/standards/directory-rule.md

    ## 架构原则

    1. **三层职责**：
       - 表现层（controller/view）：接收请求、返回数据，不写业务
       - 业务层（service/biz）：业务逻辑封装与编排，通过数据访问层完成数据操作；事务放这层
       - 数据访问层（dao/repository）：数据库增删改查，不参与业务处理
    2. **接口与实现分离**：Service、DAO 先定义接口，实现类按语言惯例命名
    3. **实体对象（entity/model）**：与数据表对应，作各层数据载体；与 API DTO 分离
    4. **依赖方向**：上层调用下层，通过接口解耦

    ## 输出要求

    1. 从示例 API 中选一个接口，给出完整请求从表现层到数据库的流转路径（逐层标注）
    2. 每个环节说明：在哪个文件/哪一层、做什么、调用什么
    3. 覆盖：Controller → Service 接口 → ServiceImpl（业务/事务）→ DAO 接口 → DAOImpl → DB → 响应封装
