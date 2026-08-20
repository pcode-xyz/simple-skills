# App · 工具层（prompt 模板）

## prompt 模板

    你是一位资深移动端架构师，精通{方案：Flutter/React Native/原生}。请你基于项目信息，
    遵守架构原则，在此基础上说明移动端工具层的组织方式，并输出至 docs/standards/。

    ## 项目信息

    请阅读以下文件：
    - 业务流程描述：docs/product/business-flow.md
    - 已定义 API：docs/specs/API（或 docs/specs/grpc）
    - 技术选型：docs/standards/tech-stack-rule.md
    - 目录结构：docs/standards/directory-rule.md

    ## 架构原则（工具层相关）

    移动端采用组件式开发，工具层 = 网络与设备能力，与 UI 解耦：
    1. **网络层**：HTTP 客户端封装（dio/axios/原生），含拦截器、错误处理、鉴权、envelope 解析
    2. **本地能力**：本地存储、偏好设置、平台通道（Platform Channel）/原生桥接、文件
    3. **设备/平台工具**：推送、埋点上报、日志、崩溃捕获、配置
    4. **按需直调**：页面/Widget 直接调用工具，不经过 UI 包装
    5. 对内可抽象、对外透明；状态管理（Riverpod/Zustand 等）与工具层解耦

    ## 输出要求

    1. 工具层完整目录结构（网络、存储、平台通道、上报、日志等）
    2. 每个工具的对外接口与职责
    3. 以一个页面/Widget（用示例 API）为例，标注它如何调用网络层（含拦截器、错误处理）
    4. 工具层与页面/状态管理的边界
    5. 工具初始化方式（App 启动时装配）
