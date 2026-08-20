# Task-UCS 转测试提取规范

> 版本基线：2026-06-27 | 扁平业务切片架构 · asynq 多进程模型

## 一、规范定位

本规范定义**如何从 task-UCS（异步任务用例规约）系统性提取测试用例**。

与 `ucs-to-testing.md`（HTTP Handler 测试提取）的关系：

| 维度 | ucs-to-testing.md | 本规范 |
|------|------------------|--------|
| 适用对象 | `handlers/{module}/*` | `task/{module}/*` |
| 入口触发 | HTTP 请求（httptest + gin） | 直接调用 `HandleXxxTask(ctx, *asynq.Task)` |
| 断言对象 | HTTP status / response body / biz code | **DB 状态字段** + **Redis 状态** + **外部服务调用** |
| 外部依赖 | 一般只有 DB | DB + Redis + LLM + 地图 API（需 Mock） |
| 权限矩阵 | ✅ 需提取 | ❌ 不涉及（Worker 无角色概念） |
| 并发安全 | 可选 | **必提取**（分布式锁是核心机制） |
| 状态机 | 有（HTTP 资源状态） | **必提取**（infer_status / is_used 等） |

**共同原则**：
- 测试用例从 task-UCS 中提取，不凭空设计
- 1 个 task-UCS 文档 ↔ 1 个 task 文件 ↔ 该文件下的测试文件
- task-UCS 中每个结构化章节均对应特定测试维度，无遗漏

---

## 二、task-UCS 文档结构

task-UCS 文档与 HTTP-UCS 结构基本对称，但去掉了 HTTP 特有章节，强化了异步任务特有章节：

### 2.1 用例章节（每个任务独立一章）

每个任务包含固定子节，**6 个直接产出测试用例**：

| 子节 | 测试价值 | 优先级 |
|------|---------|--------|
| 主成功场景 | ✅ **高**：Happy Path 测试来源，断言 DB 状态变更 | 必提取 |
| 扩展流程 | ✅ **高**：分支/非致命错误路径测试来源 | 必提取 |
| 异常流程 | ✅ **高**：负向测试来源（fatal 错误路径） | 必提取 |
| 业务规则 | ✅ **高**：规则验证测试来源（锁、回滚、覆盖策略等） | 必提取 |
| 数据要求 | ✅ **中**：多表写入一致性测试来源 | 按需提取 |
| 前置/后置条件 | ⚠️ **低**：辅助推断测试 setup 和断言内容 | 参考 |

### 2.2 任务特有章节（HTTP-UCS 中无对应）

| 子节 | 测试价值 | 优先级 |
|------|---------|--------|
| 分布式锁键 | ✅ **高**：并发安全测试来源（锁存在/清理/超时） | 必提取 |
| Payload 结构 | ✅ **中**：payload 校验测试来源 | 按需提取 |
| 广播消息结构 | ✅ **中**：Pub/Sub 消息内容断言来源 | 按需提取 |
| 摘要统计计算规则 | ✅ **高**：纯函数单元测试来源 | 必提取 |
| 外部依赖表 | ✅ **高**：Mock 范围定义来源 | 必提取 |

---

## 三、提取规则

### 3.1 主成功场景 → Happy Path

**提取方式**：将场景中的每个步骤转化为 DB 状态断言。

```
task-UCS 步骤              →    测试断言
─────────────────────────────────────────────────────
1. 查询 PENDING 想法       →    setup：向 idea 表写入 PENDING 测试数据
2. 调用 LLM 推断           →    Mock LLM 返回固定结果（无需真实调用）
3. 调用 POI 获取坐标       →    Mock 高德 API 返回固定坐标
4. 更新 idea 状态          →    断言：infer_status = 'CONFIRMED'，各推断字段正确
5. 广播结果                →    断言：Redis Publish 被调用，消息内容正确
6. 清理锁键                →    断言：Redis 键 infer:running:{trip_id} 已删除
```

**示例（TASK-IDEA-001）**：

```go
func TestHandleInferIdeaTask_TASK_IDEA_001_HappyPath(t *testing.T) {
    // setup: 插入 PENDING 想法 + Mock LLM + Mock POI
    // 执行: HandleInferIdeaTask(ctx, task)
    // 断言: idea.infer_status = 'CONFIRMED'
    // 断言: idea.inferred_latitude = 30.5728 (Mock POI 返回值)
    // 断言: Redis 键 infer:running:{trip_id} 已删除
}
```

### 3.2 扩展流程 → 分支测试

**提取方式**：每个扩展条件对应一个分支用例，重点关注**非致命错误路径**和**部分成功**。

| 扩展流程类型 | 测试内容 | 示例 |
|------------|---------|------|
| 空数据提前返回 | 无待处理数据时静默成功，不报错 | 无 PENDING 想法 → 任务返回 nil |
| 外部服务降级 | 外部服务失败时的降级行为 | POI 失败 → 坐标为 0，仍标 CONFIRMED |
| 非致命错误 | 部分操作失败不阻断主流程 | 想法 is_used 更新失败 → 主流程仍完成 |
| LLM 特殊返回 | LLM 返回非预期结果的处理 | NeedsMoreInfo → 状态变 NEEDSINFO，不写坐标 |

**示例（TASK-IDEA-001 扩展3：POI 搜索失败）**：

```go
func TestHandleInferIdeaTask_TASK_IDEA_001_POIFailed_StillConfirmed(t *testing.T) {
    // setup: 插入 PENDING 想法 + Mock LLM 正常 + Mock POI 返回错误
    // 执行: HandleInferIdeaTask(ctx, task)
    // 断言: idea.infer_status = 'CONFIRMED'（仍成功）
    // 断言: idea.inferred_latitude = 0, inferred_longitude = 0
    // 断言: 其他推断字段（city/category/emoji）正常写入
}
```

### 3.3 异常流程 → 负向测试

**提取方式**：每个 fatal 异常条件对应一个负向用例，**必须同时断言 history/status 表的失败状态**。

```
异常条件                   →    测试输入                    →    断言
──────────────────────────────────────────────────────────────────────────────
LLM 调用失败               →    Mock LLM 返回 error          →    ai_plan_history.status = 'failed'
                                                          →    ai_plan_history.error_message 含关键字
                                                          →    idea 状态回滚为 PENDING（infer 任务）
route_data 校验失败        →    Mock LLM 返回非法格式数据   →    ai_plan_history.status = 'failed'
                                                          →    trip_route 表无新记录写入
DB 查询失败               →    关闭 DB 连接 / 注入错误     →    任务返回 error（触发 asynq 重试）
payload 格式错误           →    传入非法 JSON payload       →    任务立即返回 error
```

**关键原则**：
- **fatal 错误**（主流程中断）：必须断言 `ai_plan_history.status = 'failed'` 和 `error_message`
- **非 fatal 错误**（部分失败容忍）：必须断言主流程**仍然完成**，只有局部日志记录

### 3.4 业务规则 → 规则验证测试

**提取方式**：每条业务规则对应一个验证用例，重点关注**分布式锁**和**状态回滚**机制。

| 业务规则类型 | 测试内容 | 示例 |
|------------|---------|------|
| 分布式锁（幂等保护） | 锁存在时的行为 + 锁清理时机 | 任务执行中锁存在；任务结束（无论成败）锁被清理 |
| 状态回滚 | fatal 错误时状态完全回滚 | LLM 失败 → 所有 INFERRING 想法回滚为 PENDING |
| 非 fatal 错误容忍 | 部分失败不阻断主流程 | 想法 is_used 更新失败，路线数据仍写入 |
| Upsert 覆盖策略 | 重复执行结果可预期 | 同一 trip_id 两次规划，第二次覆盖第一次 |
| 坐标来源唯一性 | 坐标只来自 POI，不来自 LLM | POI 失败时坐标为 0，不使用 LLM 推断值 |
| 上下文限制 | 数量边界行为 | 已确认想法 > 10 条，只取最新 10 条作为上下文 |

**示例（分布式锁测试）**：

```go
func TestHandleInferIdeaTask_TASK_IDEA_001_LockCleanedAfterSuccess(t *testing.T) {
    // setup: 设置 Redis 键 infer:running:{trip_id}
    // 执行: HandleInferIdeaTask(ctx, task)
    // 断言: 任务成功，锁键被删除
}

func TestHandleInferIdeaTask_TASK_IDEA_001_LockCleanedAfterFailure(t *testing.T) {
    // setup: Mock LLM 失败 + 设置 Redis 锁键
    // 执行: HandleInferIdeaTask(ctx, task)
    // 断言: 任务返回 error，但锁键仍被删除（defer 保证）
}
```

### 3.5 分布式锁 → 并发安全测试

**提取方式**：从分布式锁键章节提取竞态条件，用 `-race` 标志运行测试。

```
并发场景                       →    测试方式
───────────────────────────────────────────────────────────────────
同一 trip_id 并发触发推断      →    goroutine 并发调用 HandleInferIdeaTask，
                                  断言：第二次执行时发现无 PENDING 数据（已被第一次处理完），
                                  或直接验证锁键机制（Redis SETNX 语义）
同一 trip_id 并发触发规划      →    goroutine 并发调用 HandleGeneratePlanTask，
                                  断言：history 状态最终为 completed 或 failed（无中间态残留）
```

**注意**：完整并发测试需要真实 Redis（testcontainers-go），或在集成测试中验证 `running:running:{trip_id}` 键的 SET/DEL 原子性。

### 3.6 数据要求 → 多表写入一致性测试

**提取方式**：从数据要求章节提取多表操作场景，验证各表状态一致。

| 数据操作类型 | 测试内容 | 示例 |
|------------|---------|------|
| 多表写入（fatal） | 任一步骤失败，验证各表状态是否符合预期 | trip_route 写入成功 + history 更新失败 → history 状态不一致（已知风险） |
| 多表写入（非 fatal） | 非 fatal 步骤失败，主表数据仍正确 | idea.is_used 更新失败 → trip_route 仍写入 |
| Upsert 幂等性 | 重复执行不产生重复记录 | 同一 trip_id 执行两次，trip_route 只有一条记录 |
| 状态回滚 | fatal 错误后所有中间状态已清理 | LLM 失败 → idea.infer_status 全部回到 PENDING，无 INFERRING 残留 |

### 3.7 状态流转 → 状态机测试

**提取方式**：从业务规则和主成功场景中提取状态转换，分别验证合法转换和非法状态残留。

```
合法转换（主成功场景后应达到）：
  idea: PENDING → INFERRING → CONFIRMED     →    断言：最终状态 = CONFIRMED
  idea: PENDING → INFERRING → NEEDSINFO     →    断言：最终状态 = NEEDSINFO
  idea: is_used = false → is_used = true    →    断言：规划完成后 is_used = true
  history: pending → completed              →    断言：status = 'completed', route_data 非空
  history: pending → failed                 →    断言：status = 'failed', error_message 非空

异常后状态（fatal 错误后应回滚）：
  idea: INFERRING → PENDING（LLM 失败）     →    断言：无 INFERRING 状态残留
  history: 无记录 → failed                  →    断言：新增 failed 记录
```

### 3.8 摘要统计计算规则 → 纯函数单元测试

**提取方式**：从摘要统计计算规则章节直接提取纯函数测试，无需 DB/Redis，使用 go-sqlmock 或无需任何 Mock。

**示例（TASK-AI-001 `calcSummary` 和 `haversine`）**：

```go
func TestCalcSummary_EmptyRouteData_ReturnsZero(t *testing.T) {
    summary := calcSummary([]llm.DayPlan{})
    assert.Equal(t, 0, summary.TotalDays)
    assert.Equal(t, 0, summary.WaypointCount)
    assert.Equal(t, 0, summary.CityCount)
    assert.Equal(t, 0.0, summary.TotalDistance)
}

func TestCalcSummary_MultipleDays_CorrectCounts(t *testing.T) {
    routeData := []llm.DayPlan{
        {Items: []llm.RouteItem{{InferredCity: "成都"}, {InferredCity: "成都"}}},
        {Items: []llm.RouteItem{{InferredCity: "重庆"}}},
    }
    summary := calcSummary(routeData)
    assert.Equal(t, 2, summary.TotalDays)
    assert.Equal(t, 3, summary.WaypointCount)
    assert.Equal(t, 2, summary.CityCount) // 成都 + 重庆
}

func TestHaversine_ChengduToChongqing_Approximately240km(t *testing.T) {
    // 成都 (30.57, 104.07) → 重庆 (29.56, 106.55)
    dist := haversine(30.57, 104.07, 29.56, 106.55)
    assert.InDelta(t, 240.0, dist, 10.0) // 允许 10km 误差
}
```

---

## 四、测试覆盖矩阵

每个 task-UCS 完成后，用此矩阵自检，确保无遗漏：

| 测试维度 | 提取来源 | 断言要点 |
|---------|---------|---------|
| Happy Path | 主成功场景 | DB 各表字段正确 + Redis 锁清理 + 广播消息内容 |
| 分支逻辑 | 扩展流程 | 非致命错误路径主流程仍完成 + 降级字段值正确 |
| fatal 负向 | 异常流程（fatal） | history.status = 'failed' + error_message 含关键字 + 状态回滚完成 |
| 非 fatal 负向 | 扩展流程（非致命） | 主表数据正确 + 局部表数据未更新 |
| 分布式锁 | 业务规则（锁） | 任务成功/失败后锁键均被清理 |
| 状态回滚 | 业务规则（回滚） | fatal 错误后无中间状态残留（INFERRING → PENDING） |
| 状态机 | 业务规则（状态流转） | 合法转换达到目标状态，非法状态残留不存在 |
| 多表一致性 | 数据要求 | Upsert 幂等 + 各表状态符合 fatal/non-fatal 预期 |
| 纯函数 | 摘要统计计算规则 | 边界值（空数据/单条/多条）+ 距离计算精度 |
| 并发安全 | 分布式锁 + 业务规则 | `-race` 通过 + 锁机制保证幂等 |

---

## 五、测试类型选择

| 测试维度 | 测试类型 | 工具 |
|---------|---------|------|
| 纯函数（calcSummary/haversine/buildInferRequestItems） | 单元测试 | testify，无需 Mock |
| Happy Path / 分支 / 负向（含 DB 状态变更） | 集成测试 | testcontainers-go + Mock LLM/POI |
| 分布式锁 / 并发安全 | 集成测试 | testcontainers-go（真实 Redis）+ `-race` |
| 状态机 / 状态回滚 | 集成测试 | testcontainers-go（真实 DB + Redis） |
| Redis Pub/Sub 广播内容 | 集成测试 | testcontainers-go（真实 Redis，Subscribe 验证消息） |

**不推荐 E2E 测试**：task 层没有 HTTP 接口，不适合用 httptest + gin.TestMode 方式。直接调用 `HandleXxxTask(ctx, task)` 即可。

---

## 六、Mock 策略

task 层的外部依赖比 handler 层复杂，需要明确 Mock 范围：

| 外部依赖 | 测试中处理方式 | 说明 |
|---------|--------------|------|
| 数据库（config.DB） | **真实 DB**（testcontainers-go） | 需要验证真实 DB 状态，不宜 Mock |
| Redis（config.RDB） | **真实 Redis**（testcontainers-go） | 锁机制和 Pub/Sub 需真实 Redis 验证 |
| LLM 服务（tools/llm） | **Mock / 替换函数** | 将 LLM 调用抽象为可替换函数，测试时注入固定返回值 |
| 高德地图 API（tools/map） | **Mock / 替换函数** | 将 POI 搜索抽象为可替换函数，测试时注入固定坐标或错误 |

**Mock 实现建议**：

在 task 文件中将外部调用抽象为包级变量（函数指针），测试时替换：

```go
// task/idea/infer.go
var llmInferIdeas = llm.InferIdeas        // 包级函数变量
var mapSearchPOI  = maputil.SearchPOI     // 包级函数变量

// 正常代码中调用 llmInferIdeas(...)，测试时替换：
// task/idea/infer_test.go
func TestXxx(t *testing.T) {
    llmInferIdeas = func(...) (...) { return mockResults, nil }
    defer func() { llmInferIdeas = llm.InferIdeas }()
    // ...
}
```

---

## 七、测试文件规范

### 7.1 文件命名

| 测试类型 | 命名规则 | 示例 |
|---------|---------|------|
| 集成测试 | `{task_file}_integration_test.go` | `infer_integration_test.go` |
| 单元测试 | `{task_file}_test.go` | `generate_plan_test.go`（纯函数） |

### 7.2 函数命名

格式：`Test<HandleFunc>_<TASK编号>_<场景>`

```go
// Happy Path
TestHandleInferIdeaTask_TASK_IDEA_001_HappyPath
TestHandleGeneratePlanTask_TASK_AI_001_HappyPath

// 扩展流程（分支）
TestHandleInferIdeaTask_TASK_IDEA_001_NoPendingIdeas_SilentSuccess
TestHandleInferIdeaTask_TASK_IDEA_001_POIFailed_CoordinatesZero
TestHandleInferIdeaTask_TASK_IDEA_001_NeedsMoreInfo_StatusNeedsInfo
TestHandleGeneratePlanTask_TASK_AI_001_IsUsedUpdateFailed_RouteStillWritten

// 异常流程（fatal）
TestHandleInferIdeaTask_TASK_IDEA_001_LLMFailed_IdeasRollbackToPending
TestHandleGeneratePlanTask_TASK_AI_001_LLMFailed_HistoryStatusFailed
TestHandleGeneratePlanTask_TASK_AI_001_RouteValidateFailed_HistoryStatusFailed

// 业务规则
TestHandleInferIdeaTask_TASK_IDEA_001_LockCleanedAfterSuccess
TestHandleInferIdeaTask_TASK_IDEA_001_LockCleanedAfterFailure
TestHandleGeneratePlanTask_TASK_AI_001_UpsertOverwritesPreviousRoute

// 纯函数单元测试
TestCalcSummary_EmptyRouteData_ReturnsZero
TestCalcSummary_MultipleDays_CorrectCounts
TestHaversine_ChengduToChongqing_Approximately240km
```

### 7.3 用例组织

使用 `t.Run` 组织同一任务的多个场景，共享 setup 逻辑：

```go
func TestHandleInferIdeaTask(t *testing.T) {
    // 共享 setup：初始化 testcontainers DB + Redis

    t.Run("TASK_IDEA_001_HappyPath", func(t *testing.T) {
        // ...
    })

    t.Run("TASK_IDEA_001_NoPendingIdeas_SilentSuccess", func(t *testing.T) {
        // ...
    })

    t.Run("TASK_IDEA_001_LLMFailed_IdeasRollbackToPending", func(t *testing.T) {
        // ...
    })
}
```

---

## 八、task-UCS 测试提取快速参考

从 task-UCS 的每个章节，对应提取的测试项：

| task-UCS 章节 | 提取的测试项 |
|---|---|
| 2.1 任务名称 | — 不产出测试 |
| 2.2 任务概述 | — 不产出测试 |
| 2.3 参与者 | — 不产出测试（确定 Mock 范围） |
| 2.4 前置条件 | 辅助推断 setup（测试数据准备） |
| 2.5 后置条件 | 辅助推断断言（成功/失败的 DB 状态） |
| 2.6 主成功场景 | ✅ Happy Path 测试（每步 → 一个 DB 断言） |
| 2.7 扩展流程 | ✅ 分支测试（每个扩展 → 一个分支用例） |
| 2.8 异常流程 | ✅ 负向测试（每个 fatal 异常 → 一个负向用例） |
| 2.9 业务规则 | ✅ 规则验证测试（锁/回滚/覆盖/唯一性 → 各一个用例） |
| 2.10 数据要求 | ✅ 多表一致性测试 + 状态回滚测试 |
| 2.11 外部依赖 | 辅助确定 Mock 范围（不直接产出测试） |
| 2.12 Payload 结构 | 辅助构造测试输入（payload 校验用例，按需） |
| 2.13 广播消息结构 | ✅ Pub/Sub 消息内容断言（按需） |
| 2.14 摘要统计计算规则 | ✅ 纯函数单元测试 |
