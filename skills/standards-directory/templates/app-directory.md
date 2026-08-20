# App 目录设计（prompt 模板）

## prompt 模板

    你是一位资深移动端架构师，精通{方案：Flutter/React Native/原生}。请基于项目信息，
    遵守架构原则，设计移动端项目目录结构主方案，给出完整的目录树（树形展示），并输出至 docs/standards/。

    ## 项目信息

    请阅读以下文件：
    - 业务流程描述：docs/product/business-flow.md
    - 已定义 API：docs/specs/API（或 docs/specs/grpc）
    - 技术选型：docs/standards/tech-stack-rule.md

    ## 架构原则

    - 组件式开发：UI 拆分为可复用组件/Widget，遵循所选 UI 方案
    - 按功能模块（feature）组织，模块高内聚
    - 技术栈：{按 architecture 选择注入，如 Flutter + Riverpod + go_router + dio，或 RN + React Navigation + Zustand}
    - 平台：{iOS / 安卓}

    ## 输出要求

    1. 完整目录树（按 feature 模块 + 公共层组织，如 lib/{core, features, shared} 或 src/{api, components, screens, navigation, store}）
    2. 各目录职责说明
    3. 组件/Widget 复用与模块边界约定
