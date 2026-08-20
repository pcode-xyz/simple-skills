# 桌面端 · 工具层（prompt 模板）

## prompt 模板

    你是一位资深桌面端架构师，精通{方案：Tauri/Electron}。请你基于项目信息，遵守架构原则，
    在此基础上说明桌面端工具层的组织方式，并输出至 docs/standards/。

    ## 项目信息

    请阅读以下文件：
    - 业务流程描述：docs/product/business-flow.md
    - 已定义 API：docs/specs/API（或 docs/specs/grpc）
    - 技术选型：docs/standards/tech-stack-rule.md
    - 目录结构：docs/standards/directory-rule.md

    ## 架构原则（工具层相关）

    桌面端采用组件式开发，工具层分前端工具与后端（core/主进程）能力：
    1. **前端工具**：请求封装、存储、日志、上报（同前端工具层约定）
    2. **后端能力（core/主进程）**：{Tauri：Rust commands / Electron：主进程 IPC}——文件、系统、本地能力
    3. **桥接层**：前端调用后端能力的统一入口（invoke/IPC 封装），错误与返回规范化
    4. **按需直调**：页面直接调用工具/桥接，不经过 UI 包装
    5. 对内可抽象、对外透明

    ## 输出要求

    1. 工具层完整目录结构（前端工具 + 后端能力 + 桥接层）
    2. 每个工具的对外接口与职责
    3. 以一个页面（用示例 API）为例，标注它如何调用请求工具与桥接层
    4. 工具层与页面/状态管理的边界
    5. 工具初始化方式
