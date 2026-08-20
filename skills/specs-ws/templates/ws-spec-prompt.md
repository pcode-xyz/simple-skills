# WebSocket 协议定义（AsyncAPI 2.6，prompt 模板）

> 从 chat.yaml 参考反推。语言/中间件由 subagent 从 tech-stack-rule 读取，主流程不注入。

## prompt 模板

    你是一位资深后端工程师，精通{语言}和实时通信协议设计。请基于项目信息，遵守通道划分原则，
    定义 WebSocket 协议文档（AsyncAPI 2.6），输出至 docs/specs/ws/。

    ## 项目信息

    请阅读以下文件：
    - 业务流程描述：docs/product/business-flow.md
    - 技术选型：docs/standards/tech-stack-rule.md（WS 中间件：如 gorilla/websocket、socket.io 等）
    - 目录结构：docs/standards/directory-rule.md
    - 已定义 HTTP API：docs/specs/API（WS 承载事件/流，HTTP 承载命令/查询，互补不重叠）
    - demo 页面：docs/product/demo/（页面实时交互场景，如聊天、进度、状态更新）
    - DB 设计：docs/specs/data/（字段对齐）

    ## 通道划分原则

    - HTTP（specs/API）承载"命令/查询"；WS（本文件）承载"事件/流"——两者互补，不重叠
    - 从 business-flow / demo 识别实时通道：聊天、推送、进度事件、状态变更广播等
    - 与 HTTP API 的对应关系在 info.description 中说明（如"WS 只承载事件/流，HTTP 承载命令/查询"）

    ## 方向语义（AsyncAPI 视角）

    - 「subscribe」 = 应用接收 = 客户端→服务端（客户端发的帧）
    - 「publish」 = 应用发送 = 服务端→客户端（服务端广播的帧）

    ## 契约三要素

    1. 消息目录：channels / messages / schemas
    2. 生命周期：channel 描述（连接 / 收发 / 断线重连）
    3. 投递语义：channel 的「x-delivery-semantics」扩展（每帧类型：persistence / replayable / idempotent）

    ## 输出要求（AsyncAPI 2.6）

    1. `asyncapi: '2.6.0'` + info（title / version / description：含契约三要素与通道划分说明）
    2. `servers`：production（wss）+ dev（ws），security（如 bearerAuth）
    3. `channels`：每通道含——
       - description：生命周期（连接握手 / 首次打开 / 收发 / 断线重连）+ 协议约定（心跳 Ping/Pong、前向兼容只增字段、限流）
       - bindings：ws → method / query 参数 / headers 认证
       - subscribe（客户端→服务端，message oneOf）
       - publish（服务端→客户端，message oneOf）
       - x-delivery-semantics（每帧类型：持久化 / 可重放 / 幂等）
    4. `components`：securitySchemes、messages（name / title / summary / contentType / correlationId / payload）、
       schemas（payload 字段对齐 DB；必填 / 枚举 / 示例清晰）
    5. 消息按 message_id 排序与幂等；WS 消息与 HTTP 历史列表项**同构**（前端一套渲染）；
       心跳用协议层 Ping/Pong 非应用层消息

    ## 行为约束

    - 只写 docs/specs/ws/ 下的 yaml，不改 specs/API
    - 字段/枚举对齐 docs/specs/data 与现有 API；命名遵循所选语言/中间件约定
