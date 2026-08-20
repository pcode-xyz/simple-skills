# 前端 · 工具层（prompt 模板）

## prompt 模板

    你是一位资深前端架构师，精通{前端框架}。请你基于项目信息，遵守架构原则，
    在此基础上说明前端工具层的组织方式，并输出至 docs/standards/。

    ## 项目信息

    请阅读以下文件：
    - 业务流程描述：docs/product/business-flow.md
    - 已定义 API：docs/specs/API（或 docs/specs/grpc）
    - 技术选型：docs/standards/tech-stack-rule.md
    - 目录结构：docs/standards/directory-rule.md

    ## 架构原则（工具层相关）

    前端采用组件式开发，工具层 = 请求与通用能力，与 UI 组件解耦：
    1. **请求封装**：统一 HTTP 客户端（axios/fetch 封装），含拦截器、错误处理、鉴权、响应 envelope 解析（code/data/message）
    2. **通用工具**：存储（localStorage/sessionStorage）、格式化、鉴权 token 管理、错误上报、日志等
    3. **按需直调**：页面/组件直接调用工具，不经过 UI 层包装
    4. **对内可抽象、对外透明**：工具内部可封装重试、缓存，对调用方透明
    5. 状态管理（store）与工具层解耦；API 定义按模块组织

    ## 输出要求

    1. 工具层完整目录结构（如 src/api/、src/utils/、src/storage/、src/logger/、src/error/ 等）
    2. 每个工具的对外接口与职责：请求客户端、鉴权、存储、上报
    3. 以一个页面/组件（用示例 API）为例，标注它如何调用请求工具（含拦截器、错误处理）
    4. 工具层与组件/页面/store 的边界
    5. 工具初始化方式（环境变量、启动时配置）
