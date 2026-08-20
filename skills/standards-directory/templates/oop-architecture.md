# 面向对象三层架构（后端目录设计 prompt）

## prompt 模板

    你是一位资深后端工程师，精通{语言}和面向对象设计。请基于项目信息，遵守架构原则，
    设计基于三层架构（表现层 / 业务层 / 数据访问层）的后端项目目录结构主方案，
    给出完整的目录树（树形展示），并输出至 docs/standards/。

    ## 项目信息

    请阅读以下文件：
    - 业务流程描述：docs/product/business-flow.md
    - DB 设计文件：docs/specs/data/（table.sql 或 schema.json）
    - 已定义 API：docs/specs/API（或 docs/specs/grpc）
    - 技术选型：docs/standards/tech-stack-rule.md

    ## 架构原则

    1. **三层职责**：
       - 表现层（controller/view）：接收请求、返回数据，不写业务
       - 业务层（service/biz）：业务逻辑封装与编排，通过数据访问层完成数据操作；**事务放这层**
       - 数据访问层（dao/repository）：数据库增删改查，不参与业务处理
    2. **接口与实现分离**：Service、DAO 先定义接口，实现类按语言惯例命名（如 `XxxServiceImpl` / `XxxDaoImpl`）
    3. **实体对象（entity/model）**：与数据表一一对应，作为各层间数据传递载体；与 API DTO 分离
    4. **通用层（common/util）**：工具类、基础类，供各层调用
    5. **依赖方向**：上层调用下层，通过接口解耦；实体对象贯穿各层

    ## 输出要求

    1. 完整目录树（如 controller/ service(+impl)/ dao(+impl)/ entity|model/ dto/ common/ config/ 等）
    2. 各目录职责说明
    3. 以一个业务模块为例展示各层文件结构
    4. 请求从表现层到业务层到数据访问层的流转路径
