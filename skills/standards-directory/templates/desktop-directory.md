# 桌面端目录设计（prompt 模板）

## prompt 模板

    你是一位资深桌面端架构师，精通{方案：Tauri/Electron}。请基于项目信息，遵守架构原则，
    设计桌面端项目目录结构主方案，给出完整的目录树（树形展示），并输出至 docs/standards/。

    ## 项目信息

    请阅读以下文件：
    - 业务流程描述：docs/product/business-flow.md
    - 已定义 API：docs/specs/API（或 docs/specs/grpc）
    - 技术选型：docs/standards/tech-stack-rule.md

    ## 架构原则

    - 组件式开发：UI 拆分为可复用组件
    - 前后端进程/运行时边界清晰（{Tauri：前端 + Rust core；Electron：主进程 + 渲染进程}）
    - 技术栈：{按 architecture 选择注入}

    ## 输出要求

    1. 完整目录树（前端部分按模块组织；后端/主进程部分按职责组织）
    2. 各目录职责说明
    3. 前端与后端（core/主进程）之间的接口约定
