# 小程序 · 工具层（prompt 模板）

## prompt 模板

    你是一位资深小程序架构师，精通{方案：uni-app/Taro/原生}。请你基于项目信息，遵守架构原则，
    在此基础上说明小程序工具层的组织方式，并输出至 docs/standards/。

    ## 项目信息

    请阅读以下文件：
    - 业务流程描述：docs/product/business-flow.md
    - 已定义 API：docs/specs/API（或 docs/specs/grpc）
    - 技术选型：docs/standards/tech-stack-rule.md
    - 目录结构：docs/standards/directory-rule.md

    ## 架构原则（工具层相关）

    小程序采用组件式开发，工具层 = 请求与平台能力，与页面解耦：
    1. **请求封装**：统一请求（wx.request/uni.request/Taro.request 封装），含拦截器、错误处理、鉴权、envelope 解析、登录态刷新
    2. **平台能力**：本地存储、登录/授权、支付、分享、云能力（按平台）
    3. **通用工具**：格式化、埋点上报、日志、配置
    4. **按需直调**：页面直接调用工具，不经过 UI 包装
    5. 对内可抽象、对外透明；状态管理（Pinia/Zustand 等）与工具层解耦

    ## 输出要求

    1. 工具层完整目录结构（请求、存储、登录/授权、上报、日志等）
    2. 每个工具的对外接口与职责
    3. 以一个页面（用示例 API）为例，标注它如何调用请求工具（含拦截器、登录态处理）
    4. 工具层与页面/状态管理的边界
    5. 工具初始化方式
