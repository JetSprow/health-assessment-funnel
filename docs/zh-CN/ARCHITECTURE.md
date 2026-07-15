**简体中文** · [English](../en/ARCHITECTURE.md) · [文档中心](README.md)

# 系统架构

## 系统上下文

```mermaid
flowchart LR
  Browser[匿名浏览器] -->|HTTP / HTTPS| Proxy[Nginx 反向代理]
  Proxy --> App[Next.js App Router]
  App --> Domain[测评领域层]
  App --> Prisma[Prisma Client]
  Prisma --> DB[(PostgreSQL)]
```

应用有意采用模块化单体。三天挑战不需要分布式服务；清晰的事务边界、部署简单性和可测试性比过早拆分服务更重要。

## 应用分层

```text
src/app/                         路由与 UI
src/app/api/                     HTTP Route Handlers
src/domain/assessment/           校验、算法和访问 DTO
src/server/                      数据库、匿名鉴权和 API 工具
prisma/                          Schema 与版本化 Migration
tests/unit/                      领域和 Route Handler 测试
tests/e2e/                       浏览器级用户旅程
```

### UI 层

- 落地页与匿名 Session 创建。
- 七步、一次一题的 Funnel。
- 进度恢复和 409 冲突恢复。
- 锁定与完整结果状态。
- Mock 支付状态切换。

### API 层

Route Handler 负责鉴权、请求解析、状态码和事务编排，不承载展示逻辑。

### 领域层

- `assessment.schema.ts`：完整与增量 Zod 契约。
- `assessment.algorithm.ts`：确定性的版本化计算。
- `result-access.ts`：显式公开/完整序列化路径。

### 持久化层

Prisma 映射关系模型和 Migration，PostgreSQL 约束作为应用校验的第二道边界。

## 核心时序

### 增量保存

```mermaid
sequenceDiagram
  participant B as 浏览器
  participant A as API
  participant D as PostgreSQL
  B->>A: PATCH step(requestId, version, data)
  A->>A: Cookie 鉴权 + Schema 校验
  A->>D: 按 Session/requestId 查询 StepEvent
  alt 完全重放
    D-->>A: 已存在事件
    A-->>B: 200 duplicated=true
  else 同一 Key 不同 Payload
    A-->>B: 409 IDEMPOTENCY_CONFLICT
  else 新请求
    A->>D: Upsert Profile
    A->>D: UPDATE Session WHERE version=clientVersion
    alt 版本已变化
      A-->>B: 409 VERSION_CONFLICT
    else 更新成功
      A->>D: 插入 StepEvent
      A-->>B: 200 新版本
    end
  end
```

### 结果权限与支付

```mermaid
sequenceDiagram
  participant B as 浏览器
  participant A as API
  participant D as PostgreSQL
  B->>A: GET result
  A->>D: 加载归属 Session、Result、有效 Subscription
  alt 无有效订阅
    A-->>B: 显式锁定 DTO
  else 有效订阅
    A-->>B: 显式完整 DTO
  end
  B->>A: POST pay(idempotencyKey)
  A->>D: 创建/复用 PaymentEvent + 激活 Subscription
  A-->>B: SUCCEEDED
  B->>A: 再次 GET result
  A-->>B: 完整 DTO
```

## 数据模型

```mermaid
erDiagram
  USER ||--o{ ASSESSMENT_SESSION : owns
  USER ||--o{ SUBSCRIPTION : has
  USER ||--o{ PAYMENT_EVENT : creates
  ASSESSMENT_SESSION ||--o| ASSESSMENT_PROFILE : contains
  ASSESSMENT_SESSION ||--o| ASSESSMENT_RESULT : generates
  ASSESSMENT_SESSION ||--o{ STEP_EVENT : records
  ASSESSMENT_SESSION ||--o{ PAYMENT_EVENT : unlocks
```

## 关键决策

1. **匿名 Token Hash**：原始凭证只保留在 HttpOnly Cookie。
2. **Session 乐观版本**：无需在整个 Funnel 上持有数据库行锁，也能防止多标签页静默覆盖。
3. **步骤事件幂等**：支持安全重试并保留审计能力。
4. **显式结果 DTO**：未付费用户永远不会收到受保护字段。
5. **算法版本化**：计算规则变化后，已持久化结果仍可审计。
6. **Docker Compose 部署**：为单台专用服务器提供可复现的应用、迁移、代理和数据库拓扑。
