**简体中文** · [English](../en/REQUIREMENTS_TRACEABILITY.md) · [文档中心](README.md)

# 腾讯文档要求追踪矩阵

基准文档：`【睿迄科技】全栈开发 3 天挑战`（最后修改时间：2026-06-09 19:06）。

状态说明：

- `完成`：仓库、自动化测试或线上环境中已有可验证证据。
- `待人工提交`：工程交付物已准备，但必须由候选人本人完成外部发送或身份填写。

## 核心功能与工程要求

| 原始要求 | 实现 | 测试 / 证据 | 状态 |
| --- | --- | --- | --- |
| 性别、目标、年龄、身高、体重、目标体重、运动频率 | 七步 Funnel；严格的步骤 Schema；`AssessmentProfile` 分步可空字段 | `assessment.schema.test.ts`、Playwright 主流程 | 完成 |
| 每完成一步增量保存 | `PATCH /api/sessions/{sessionId}/steps/{stepKey}` | 路由测试、真实 PostgreSQL Playwright API 测试 | 完成 |
| 中断后恢复进度 | `GET /api/sessions/{sessionId}/progress`，返回 Profile、步骤、版本 | Progress 路由测试；Playwright 刷新恢复 | 完成 |
| 随机 UserID / Session 识别 | 匿名 User + 30 天 HttpOnly Cookie；数据库仅存 Token SHA-256 Hash | Session 创建、资源归属校验、跨 Session 拒绝逻辑 | 完成 |
| 服务端计算 BMI | `calculateAssessment()` | 确定性算法单测和边界单测 | 完成 |
| 服务端计算建议摄入量 | Mifflin-St Jeor 基础公式、活动系数、目标调整和上下限 | 算法单测 | 完成 |
| 服务端计算目标预测日期 | 按减重 / 增重周变化生成目标日期与逐周曲线，最长 260 周 | 算法单测：正常、维持、封顶 | 完成 |
| 结果持久化并关联用户记录 | `AssessmentResult` 与 `AssessmentSession` 一对一；Session 归属 User | Prisma Schema、Migration、提交路由事务 | 完成 |
| 校验 `subscription_status` | 查询 User 有效 `Subscription`，同时校验过期时间 | 结果路由测试、支付结果切换测试 | 完成 |
| 非会员只返回部分脱敏数据 | 显式构造 `PublicAssessmentResultDto`，不读取客户端决定的权限 | `result-access.test.ts` 保护字段泄漏断言 | 完成 |
| 会员返回完整数据 | `FullAssessmentResultDto` 返回热量、日期、曲线、算法版本 | 路由测试、Playwright 支付后页面 | 完成 |
| `/pay` 模拟支付回调 | `POST /pay` 与 `POST /api/pay`；支付事件和订阅激活同事务 | 支付幂等、冲突和 LOCKED → FULL 测试 | 完成 |
| API 路径、方法、请求 / 响应专业 | REST 风格 Session 资源；统一 `data/error/meta.requestId` 包装 | `docs/zh-CN/API.md`、路由实现 | 完成 |
| 数据库模型稳定、可扩展 | User、Session、Profile、Result、Subscription、PaymentEvent、StepEvent；关系、索引、唯一约束和 CHECK | Mermaid Schema 图、Prisma Schema、Migration | 完成 |
| 状态一致性 | 乐观锁版本、请求幂等、事务、完成态禁止修改 | 重放、旧版本、冲突键、并发和完成态测试 | 完成 |
| TypeScript Node.js 后端 | Next.js App Router Route Handlers + TypeScript | Typecheck、生产 Build | 完成 |
| Prisma + PostgreSQL | Prisma 7 + PostgreSQL 16 | Schema 校验、Migration、CI PostgreSQL E2E、线上数据库探针 | 完成 |
| 前端具备基础视觉、文案、节奏、信任感 | 移动优先落地页、七步进度、恢复反馈、结果可视化、付费解锁 CTA | 移动端 Playwright 全流程、线上演示 | 完成 |
| 公网完整演示 | Nginx + Next.js + PostgreSQL 的专用服务器部署 | <http://82.22.31.80>、`/api/health`、线上 Playwright | 完成 |

## 测试与质量要求

| 原始要求 | 实现 / 证据 | 状态 |
| --- | --- | --- |
| 算法单测：极端 / 缺失 / 非法身高、体重、年龄 | 表驱动测试显式覆盖字段缺失、上下界、非整数年龄、NaN、Infinity、0 身高 | 完成 |
| 目标体重不合理 | 减重、增重、维持方向约束与测试 | 完成 |
| 分步保存 + 恢复：中断 | Playwright 填写三步后刷新并恢复第四步 | 完成 |
| 乱序提交 | 允许乱序写入但保留最高步骤；单元与真实 PostgreSQL API 测试 | 完成 |
| 重复提交 | 相同幂等键同 Payload 安全重放；不同 Payload 返回冲突 | 完成 |
| 并发更新 | 相同版本并发写入只允许一个成功 | 完成 |
| 非会员脱敏 vs 会员完整 | 显式 DTO 防泄漏测试 | 完成 |
| `/pay` 后状态变化与端到端切换 | 路由测试和 Playwright LOCKED → FULL → 刷新保持 | 完成 |
| 接口挡住非法数值和注入 | Zod `.strict()`、有限数值、上下界；数据库 CHECK 二次约束 | 完成 |
| 一键运行测试 | `npm test`；完整质量门禁见 `docs/zh-CN/TESTING.md` | 完成 |
| CI 自动执行 | GitHub Actions 的 Quality 与 PostgreSQL/Playwright E2E Jobs | 完成 |
| README 说明覆盖、原因、未覆盖及原因 | README `测试覆盖`、`为什么覆盖这些场景`、`暂未覆盖及原因` | 完成 |

## 交付物

| 原始要求 | 交付物 / 证据 | 状态 |
| --- | --- | --- |
| 公网 URL | <http://82.22.31.80> | 完成 |
| `/pay` 可重放 cURL / Postman | `scripts/demo-flow.sh`、`docs/zh-CN/DEMO.md` | 完成 |
| 已支付测试 sessionId | `64c41d64-1b86-4be9-b3be-f42a9b456dac`；配套演示 Cookie 见 `docs/zh-CN/DEMO.md` | 完成 |
| GitHub 链接 | <https://github.com/JetSprow/health-assessment-funnel> | 完成 |
| README 启动说明和 API 文档 | `README.md`、`docs/zh-CN/API.md` | 完成 |
| 测试代码、运行方式、覆盖范围 | `tests/`、README、`docs/zh-CN/TESTING.md` | 完成 |
| 数据库 Schema 图 | README Mermaid ER 图；`docs/zh-CN/ARCHITECTURE.md` | 完成 |
| AI 使用复盘 | `docs/zh-CN/AI_RETROSPECTIVE.md`，包括建模、Mock 数据、逻辑、边界测试和明确否决案例 | 完成 |
| 发送至三个指定邮箱 | 邮件正文、收件人和附件命名规则已整理在 `docs/zh-CN/SUBMISSION.md`；需候选人本人填写姓名并发送 | 待人工提交 |
| 文档命名 `【姓名】_全栈挑战_YYYYMMDD` | 命名模板已写入 `docs/zh-CN/SUBMISSION.md`；缺少候选人真实姓名 | 待人工提交 |

## 严格结论

截至 2026-07-15，**工程实现、自动化测试、GitHub 仓库、文档和公网演示要求均已完成**。不能宣称“所有外部动作 100% 完成”的唯一原因，是挑战要求中的邮件发送和实名文件命名必须由候选人本人完成。

当前公网环境另有一个不影响挑战验收、但影响真实生产使用的限制：它使用 HTTP/IP 和 `COOKIE_SECURE=false`。接入域名与 HTTPS 后必须改为 `COOKIE_SECURE=true`，在此之前只应填写虚构数据。
