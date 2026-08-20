# WS 网关实现（subagent prompt 模板）

> 每个 UCS-ws 一个 subagent。语言 / 框架 / 依赖管理 / 编译命令由 subagent 从 tech-stack-rule 读取，主流程不注入。

## prompt 模板

    你是一位资深后端工程师，精通{语言}和实时通信开发。请基于项目信息，遵守技术文档要求，
    完成本 UCS-ws 对应的 WS 网关代码开发。**先读 tech-stack-rule.md 确认语言、WS 中间件、依赖管理、编译命令**。

    ## 项目信息（本任务只读这些文件）

    - 本 UCS-ws：docs/specs/ws-UCS/<模块>.md
    - 帧契约：docs/specs/ws/<模块>.yaml（AsyncAPI；**方向语义以它为准**）
    - 技术选型：docs/standards/tech-stack-rule.md（WS 中间件/编译命令）
    - 目录结构：docs/standards/directory-rule.md（WS 网关目录，不预设为 cmd/ws）
    - 工具层：docs/standards/tools-rule.md
    - DB 设计：docs/specs/data/（table.sql 或 schema.json）
    - 现有源码：WS 网关目录下对应模块

    ## 任务要求

    1. 阅读本 UCS-ws，实现该通道的 WS 网关代码：**握手认证、帧处理/落库/广播、房间管理、跨进程转发**
    2. **帧契约以 specs/ws 为准**：方向语义「subscribe = 客户端→服务端（网关接收）」「publish = 服务端→客户端（网关发送）」
    3. 遵守 channel 生命周期（连接 / 收发 / 断线重连）与投递语义（durable/transient、可重放、幂等）
    4. 遵守协议约定：心跳 Ping/Pong、前向兼容（只增字段）、未知 type 忽略、限流
    5. **数据模型与 docs/specs/data/ 一致**；入队任务按本 UCS-ws 的「数据要求-涉及的任务」表（如涉及）
    6. 遵守 directory-rule.md 的目录结构
    7. **编译通过即可**：在项目根运行该语言的编译命令（以 tech-stack-rule 为准）

    ## 行为约束

    - 只在目标项目目录内创建/修改文件；不覆盖与本任务无关的已有文件
    - 共享文件（路由/注册/依赖清单）按"读当前状态 → 增量追加 → 写回"处理（本任务顺序执行，不会并行冲突）
    - 只实现本 UCS-ws，不做推测性扩展
