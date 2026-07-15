**简体中文** · [English](../en/AI_QUICKSTART.md) · [文档中心](README.md)

# AI 友好快速上手

本文档用于帮助 AI 编程助手或 Coding Agent 在最短时间内理解、修改并验证本仓库，同时避免破坏安全边界和状态一致性。

## 1. 项目目标

这是一个匿名健康测评 Funnel：

1. 创建匿名用户与测评 Session。
2. 分步保存七项问卷数据。
3. 页面中断后恢复进度。
4. 提交完整 Profile。
5. 在服务端计算并持久化带版本的测评结果。
6. 未订阅时只返回脱敏结果。
7. 通过幂等 Mock 支付激活订阅。
8. 支付后返回完整结果。

算法只用于工程演示，不具备临床诊断意义。

## 2. 建议阅读顺序

处理大多数任务时，按以下顺序阅读：

1. `AGENTS.md`：框架和 Agent 操作规则。
2. `README.zh-CN.md`：产品、启动和交付概览。
3. `prisma/schema.prisma`：权威关系模型。
4. `src/domain/assessment/assessment.schema.ts`：输入契约。
5. `src/domain/assessment/assessment.algorithm.ts`：计算规则。
6. `src/domain/assessment/result-access.ts`：脱敏/完整 DTO 边界。
7. `src/server/anonymous-session.ts`：匿名鉴权。
8. `src/app/api/` 下对应 Route Handler。
9. `tests/unit/` 与 `tests/e2e/` 下对应测试。

涉及部署时，还应阅读 `compose.yaml`、`Dockerfile`、`deploy/nginx/default.conf` 和 `docs/zh-CN/DEPLOYMENT.md`。

## 3. 技术栈与版本敏感规则

- Next.js `16.2.10`，App Router。
- React `19.2.4`。
- TypeScript 严格模式。
- Prisma `7.8.x`，Client 生成到 `src/generated/prisma/`。
- PostgreSQL 16。
- Zod 4。
- Vitest 4、Playwright 1.61。

这不是旧版 Next.js 项目。修改框架行为前，必须先阅读 `node_modules/next/dist/docs/` 下对应的本地文档。

当前代码依赖以下 Next.js 规则：

- `cookies()` 是异步函数。
- 动态 Route Handler 的 `params` 是 Promise。
- 服务端代码不能套用 Pages Router 习惯。
- 生产镜像使用 Next.js Standalone 输出。

不要手工编辑 `src/generated/prisma/`。数据库结构变化应修改 `prisma/schema.prisma`、重新生成 Client，并在生产结构变化时提交 Migration。

## 4. 仓库地图

```text
src/app/                         页面、布局和 UI
src/app/api/                     HTTP Route Handlers
src/app/pay/                     挑战兼容的 /pay 别名
src/domain/assessment/           Zod 契约、算法和 DTO
src/server/                      鉴权、Prisma 和 API 响应工具
src/generated/prisma/            自动生成的 Prisma Client，禁止手改
prisma/schema.prisma             权威数据库模型
prisma/migrations/               版本化 SQL Migration
tests/unit/                      领域和 Route Handler 测试
tests/e2e/                       移动端 UI 与真实数据库 API 测试
deploy/nginx/                    反向代理配置
scripts/                         部署、备份和演示重放脚本
docs/en/                         英文文档
docs/zh-CN/                      简体中文文档
```

## 5. 不可破坏的核心约束

### 匿名鉴权

- 浏览器通过 HttpOnly Cookie 接收 `health_assessment_session=<userId>.<rawToken>`。
- PostgreSQL 只保存原始 Token 的 SHA-256 Hash。
- 所有 Session、结果和支付操作都必须校验资源归属。
- 禁止记录、持久化或返回真实环境中的原始 Token。

### 分步持久化

- 步骤键固定为 `gender`、`goal`、`age`、`height`、`weight`、`target-weight`、`activity`。
- 每一步必须使用严格 Schema，拒绝额外字段。
- 请求必须同时携带 `requestId` 和乐观锁 `version`。
- 完全相同的重放应成功并返回 `duplicated: true`。
- 同一请求 ID 携带不同 Payload 必须返回 `409 IDEMPOTENCY_CONFLICT`。
- 旧版本必须返回 `409 VERSION_CONFLICT`。
- 已完成测评不得继续修改。

### 服务端计算

- 提交时必须重新校验完整数据。
- BMI、热量、目标日期和预测曲线只能在服务端计算。
- 结果必须保存 `algorithmVersion`。
- 传入固定 `now` 时，计算结果应保持确定性。
- 不得宣传算法经过临床验证。

### 结果权限

- 不要先构造完整对象，再为未付费用户删除字段。
- 必须分别使用白名单式脱敏 DTO 和完整 DTO 构造器。
- 未付费响应不得包含热量、目标日期、预测曲线等受保护值。

### 支付

- `/pay` 与 `/api/pay` 行为必须一致。
- 支付幂等键全局唯一。
- 支付事件创建与订阅激活必须保留在同一事务中。
- Mock 支付不得被描述为真实扣费。

### 客户界面与文案

- 客户是所有页面文案的唯一读者，不得在可见 UI 中出现开发、架构、API、数据库、算法版本、自动化测试、幂等、Session 或模拟支付等实现语言。
- 品牌显示名使用 `BETTER SELF`；视觉基调为优雅运动感、高级、简约和克制。
- 复用 `src/app/globals.css` 中的设计 Token 与动效类，保持首页、测评和报告一致。
- 新动效必须流畅且兼容 `prefers-reduced-motion`，不能影响键盘焦点、可读性或移动端操作。
- 修改客户文案或交互后，同步更新 `tests/e2e/assessment.spec.ts` 的可访问名称断言。

### 数据库与部署

- 生产数据库变更必须通过 Migration。
- 除非领域规则明确改变，否则保留数据库 CHECK 约束。
- PostgreSQL 不得绑定公网主机端口。
- App 容器使用非 root 用户运行。
- `COOKIE_SECURE=false` 仅允许用于临时 HTTP/IP 演示。

## 6. 本地启动

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run dev
```

常用环境变量：

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
COOKIE_SECURE=false
```

在可信 HTTPS 后必须使用 `COOKIE_SECURE=true`。

## 7. 质量门禁

开发过程中先运行最相关的测试，交付前运行完整门禁：

```bash
npm run db:validate
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm audit --audit-level=high
```

直接对公网环境运行 Playwright：

```bash
PLAYWRIGHT_BASE_URL=http://82.22.31.80 npm run test:e2e
```

通过 cURL 重放完整验收流程：

```bash
./scripts/demo-flow.sh
```

## 8. 任务到文件的映射

| 任务 | 优先阅读 | 验证方式 |
| --- | --- | --- |
| 修改问卷字段 | `assessment.schema.ts`、Prisma Profile、Funnel UI | Schema、路由和 E2E 测试 |
| 修改计算规则 | `assessment.algorithm.ts` | 确定性和边界测试 |
| 修改脱敏/完整权限 | `result-access.ts`、结果路由 | 防泄漏和支付结果测试 |
| 修改保存语义 | 步骤路由、`StepEvent`、Session version | 重放/并发测试和真实数据库 E2E |
| 修改支付语义 | 支付路由、`PaymentEvent`、`Subscription` | 支付幂等测试和 E2E |
| 修改数据库结构 | `prisma/schema.prisma`、新 Migration | `db:validate`、测试、Build |
| 修改客户 UI | `src/app/page.tsx`、测评/报告组件、`globals.css` | 桌面与移动端视觉检查、Playwright、文案扫描 |
| 修改部署 | Dockerfile、Compose、Nginx、脚本 | Build、健康探针、部署手册 |
| 修改公开 API | Route Handler 与双语 API 文档 | 契约测试与双语文档同步 |

## 9. AI Agent 修改流程

1. 复述需求并识别受影响的核心约束。
2. 修改前先阅读实现和最接近的测试。
3. 优先做最小但完整的纵向变更。
4. 契约变化时同步更新校验、持久化、API、UI 和文档。
5. 修复 Bug 时同时添加回归测试。
6. 先跑定向测试。
7. 再跑完整质量门禁。
8. 执行 `git diff --check` 并人工检查最终 Diff。
9. 同步更新 `docs/en/` 和 `docs/zh-CN/`。
10. 禁止提交 `.env`、凭证、真实健康数据或服务器密码。

## 10. 常见错误

- 使用旧版同步 Next.js API。
- 直接修改自动生成的 Prisma 文件。
- 信任客户端计算的健康结果。
- 返回受保护字段后只通过 CSS 隐藏。
- 将同一幂等键的不同 Payload 当作成功重放。
- 更新 Session 时不带版本条件。
- 修改生产 Schema 却不提交 Migration。
- 执行带 `--volumes` 的破坏性 Docker 清理。
- 暴露 PostgreSQL 或提交生产 Secret。
- 只更新一种语言的文档。

## 11. 完成标准

一个变更只有在以下条件全部满足时才算完成：

- 需求通过真实 API 边界可用。
- 安全和状态一致性约束保持成立。
- 测试覆盖正常路径和相关异常路径。
- Prisma 校验、Lint、Typecheck、测试和生产 Build 通过。
- 用户流程或持久化变化时，E2E 通过。
- 中英文文档同步更新。
- Diff 中不包含 Secret 或个人健康数据。
