# 前端目录设计（prompt 模板）

## prompt 模板

    你是一位资深前端架构师，精通{前端框架}。请基于项目信息，遵守架构原则，
    设计前端项目目录结构主方案，给出完整的目录树（树形展示），并输出至 docs/standards/。

    ## 项目信息

    请阅读以下文件：
    - 业务流程描述：docs/product/business-flow.md
    - 已定义 API：docs/specs/API（或 docs/specs/grpc）
    - 技术选型：docs/standards/tech-stack-rule.md

    ## 架构原则

    - 组件式开发：UI 拆分为可复用组件，遵循所选组件库约定
    - 按功能模块/页面组织，模块高内聚、低耦合
    - 技术栈：{按 architecture 选择注入，如 Vue3 + Vite + Pinia + Element Plus + axios}

    ## 输出要求

    1. 完整目录树（如 src/{api, components, views|pages, router, stores, utils, types}，业务按模块划分子目录）
    2. 各目录职责说明
    3. 组件复用与模块边界约定
