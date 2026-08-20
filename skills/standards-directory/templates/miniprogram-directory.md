# 小程序目录设计（prompt 模板）

## prompt 模板

    你是一位资深小程序架构师，精通{方案：uni-app/Taro/原生}。请基于项目信息，遵守架构原则，
    设计小程序项目目录结构主方案，给出完整的目录树（树形展示），并输出至 docs/standards/。

    ## 项目信息

    请阅读以下文件：
    - 业务流程描述：docs/product/business-flow.md
    - 已定义 API：docs/specs/API（或 docs/specs/grpc）
    - 技术选型：docs/standards/tech-stack-rule.md

    ## 架构原则

    - 组件式开发：页面拆分为可复用组件，遵循所选 UI 库
    - 按页面/功能模块组织
    - 技术栈：{按 architecture 选择注入，如 uni-app + Vue3 + uni-ui，或 Taro + React + Taro UI}
    - 平台：{微信 / 其他}

    ## 输出要求

    1. 完整目录树（如 pages、components、api、utils、store 等，按页面模块划分）
    2. 各目录职责说明
    3. 组件复用与页面边界约定
