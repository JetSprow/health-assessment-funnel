# 健康测评 Funnel 详细开发计划

## 1. 目标与验收口径

在三天挑战范围内交付一个可公开部署的全栈应用，必须形成以下闭环：

- 匿名进入，不要求注册。
- 七步测评可逐步保存、刷新恢复。
- 核心计算只能在服务端完成。
- 未订阅结果严格脱敏，不能先序列化完整对象再删除字段。
- Mock 支付具备幂等性，成功后订阅状态持久化。
- 重复、乱序、过期版本和并发请求有明确行为。
- 自动化测试、CI、数据库图、部署说明和演示路径完整。

## 2. 里程碑

### M0：工程基线（已完成）

- 初始化 Next.js 16、React 19、TypeScript、Tailwind CSS 4。
- 配置 ESLint、Vitest、Playwright、GitHub Actions。
- 安装 Prisma 7、PostgreSQL Adapter、Zod。
- 建立 `lint`、`typecheck`、`test`、`build`、数据库脚本。
- 修复依赖审计问题，保持 `npm audit` 为 0。

验收：空应用可构建，数据库 Client 可生成，CI 命令可本地执行。

### M1：数据模型与匿名身份（已完成）

- 建立 User、Session、Profile、Result、Subscription、PaymentEvent、StepEvent。
- 匿名 Cookie 使用 `userId.rawToken`，Token 原文只保存在 HttpOnly Cookie。
- 数据库保存 SHA-256 Hash。
- Session 创建和所属关系鉴权。
- 提交初始 Migration 和数据库 CHECK 约束。

验收：创建 Session 返回 201；无 Cookie 访问受保护 Session 返回 401。

### M2：增量保存与恢复（已完成）

- 七个步骤分别使用严格 Zod Schema。
- 每次请求携带 `requestId` 与 Session `version`。
- StepEvent 唯一约束实现请求幂等。
- `updateMany where version = clientVersion` 实现乐观锁。
- Progress API 转换 Prisma Decimal，返回 JSON-safe Profile。
- 前端首次加载寻找第一个缺失步骤，恢复答案和版本。
- 409 后重新读取最新进度，避免静默覆盖。

验收：刷新恢复；重复请求不重复写；旧版本 409；并发请求只有一个成功；乱序保存不降低最高步骤。

### M3：计算与提交（已完成）

- 完整 Profile 二次校验，防止绕过分步验证。
- 计算 BMI 与分类。
- 使用 Mifflin-St Jeor 基础公式和活动系数生成演示热量建议。
- 根据目标生成逐周预测曲线，最多 260 周。
- 保存计算时间、算法版本、预测封顶标志。
- Session 完成和 Result Upsert 在同一事务中执行。
- 已完成 Session 重复提交返回幂等成功。

验收：不完整 Profile 返回 422；旧版本提交返回 409；刷新后结果不重新随机计算。

### M4：结果权限与支付（已完成）

- 建立 `createPublicResultDto` 和 `createFullResultDto` 两条显式序列化路径。
- 公开 DTO 只包含 BMI 摘要和锁定区块名称。
- 会员 DTO 才包含热量、日期和预测曲线。
- `/api/pay` 和 `/pay` 支持 Mock 支付。
- 全局唯一幂等键，重复请求返回原 PaymentEvent。
- 支付与订阅激活同事务完成。
- 结果页支付成功后重新鉴权读取，刷新保持完整访问。

验收：未付费响应无受保护字段 Key/Value；同一支付键只产生一个事件；支付前 LOCKED、支付后 FULL。

### M5：产品 UI（已完成）

- 落地页说明价值、流程和隐私承诺。
- 七步单题 Funnel，含移动端布局、进度条、保存状态、返回修改。
- 结果页展示 BMI 摘要和锁定卡片。
- 会员结果展示热量、目标日期、SVG 趋势图和行动建议。
- 所有页面包含非医疗建议声明。

验收：桌面与移动端可完成完整流程；错误状态可重试；按钮有禁用/等待状态。

### M6：测试和质量门禁（已完成基础版）

- 算法边界测试。
- Schema 严格性测试。
- 恢复接口测试。
- 重复、乱序、并发和旧版本保存测试。
- 提交完整性测试。
- 脱敏 DTO 防泄漏测试。
- 支付幂等及权限切换测试。
- Playwright 覆盖创建、填写、刷新恢复、提交、支付解锁与付费后刷新。
- CI 的独立 E2E Job 启动 PostgreSQL 16、执行 Migration 并运行 Chromium。
- CI 执行 Lint、TypeScript、Vitest、Build 和 Playwright。

验收：`npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e` 全部通过。

## 3. 上线前剩余工作

### P0：公开部署

1. 创建 Supabase/PostgreSQL 生产实例。
2. 配置连接池 URL 和迁移用直连 URL（如平台要求）。
3. 在 Vercel 配置 `DATABASE_URL`。
4. 执行 `npm run db:deploy`。
5. 部署 Next.js，验证 Secure Cookie、API 和刷新恢复。
6. 把公开 URL、演示 Session 和部署时间补充到 README。

### P1：演示与交付资料

- 准备一条已完成且已付费的 Demo Session。
- 录制 2–3 分钟演示：恢复、并发冲突、脱敏、支付解锁。
- 输出 AI 协作复盘：使用场景、人工审查点、错误与修正、效率收益。
- 增加架构决策记录（ADR）：匿名身份、乐观锁、DTO 脱敏、Mock 支付。

### P1：生产加固

- API 限流和基础机器人防护。
- 结构化日志与错误监控。
- Cookie Token 轮换/撤销策略。
- Payment Provider Adapter，为真实支付预留 Webhook 验签和事件去重。
- Subscription 增加套餐、订单金额、到期任务。
- 无障碍审计、移动端真机测试和性能预算。

## 4. 风险清单

| 风险 | 影响 | 当前控制 | 后续措施 |
| --- | --- | --- | --- |
| 多标签页覆盖答案 | 数据丢失 | Session Version 乐观锁、409 恢复 | UI 增加“另一页面已更新”提示 |
| 重试造成重复事件 | 重复写/重复订阅 | Step requestId、Payment idempotencyKey | 对所有命令型 API 统一幂等规范 |
| 未付费字段泄漏 | 商业与隐私风险 | 显式 Public/Full DTO + 防泄漏测试 | 契约测试和响应快照审查 |
| 算法被误认为医疗建议 | 合规风险 | 页面与 README 声明、算法版本化 | 上线前专业合规审查 |
| 长预测导致响应过大 | 性能风险 | 260 周硬上限 | 曲线抽样和响应体预算 |
| 数据库连接耗尽 | 可用性风险 | Prisma Pg Adapter | 生产连接池、监控和压测 |

## 5. Definition of Done

- 公网 URL 可访问，HTTPS 下 Cookie 正常。
- 新用户从首页到完整报告的主路径成功。
- 刷新恢复和支付后刷新均成功。
- 所有受保护接口校验 Session 所属用户。
- 未付费 JSON 响应无完整结果对象。
- Migration 可在空数据库执行。
- Lint、TypeScript、测试、构建和 E2E 全绿。
- README、Schema 图、演示路径、测试说明、AI 复盘齐全。
