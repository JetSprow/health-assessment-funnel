**简体中文** · [English](../en/DEVELOPMENT_PLAN.md) · [文档中心](README.md)

# 健康测评 Funnel 详细开发计划

> 状态基准：2026-07-15。挑战要求的工程实现和公网部署已经完成；本计划将已完成里程碑、当前运行状态和真实生产加固待办分开记录。

## 1. 目标与验收口径

在三天挑战范围内交付一个可公开验收的全栈应用，形成以下闭环：

- 匿名进入，无需注册。
- 七步测评逐步保存，刷新后恢复。
- 核心计算只在服务端完成并持久化。
- 未订阅结果使用显式白名单 DTO 严格脱敏。
- Mock 支付幂等，成功后持久化订阅状态。
- 重复、乱序、过期版本和并发请求行为明确。
- 自动化测试、CI、数据库图、部署说明和演示路径完整。

## 2. 已完成的挑战里程碑

### M0：工程基线 — 完成

- Next.js 16、React 19、TypeScript、Tailwind CSS 4。
- ESLint、Vitest、Playwright、GitHub Actions。
- Prisma 7、PostgreSQL Adapter、Zod。
- `lint`、`typecheck`、`test`、`build` 和数据库命令。

### M1：数据模型与匿名身份 — 完成

- `User`、`AssessmentSession`、`AssessmentProfile`、`AssessmentResult`、`Subscription`、`PaymentEvent`、`StepEvent`。
- 原始匿名 Token 只保存在 HttpOnly Cookie，数据库仅存 SHA-256 Hash。
- Session 创建、资源归属鉴权、Migration 与数据库 CHECK 约束。

### M2：增量保存与恢复 — 完成

- 七个步骤均使用严格 Zod Schema。
- `requestId` 请求幂等与 Session `version` 乐观锁。
- 重放、冲突键、旧版本、乱序和并发语义已实现并测试。
- Progress API 返回 JSON-safe Profile、当前步骤和版本。
- 前端刷新恢复，并在 409 后重新同步服务器状态。

### M3：服务端计算与提交 — 完成

- 提交时再次校验完整 Profile。
- 服务端计算 BMI、分类、演示热量建议、目标日期和最长 260 周预测曲线。
- 持久化算法版本、计算时间和预测封顶标志。
- Result Upsert 与 Session 完成在同一事务中执行。

### M4：结果权限与支付 — 完成

- `createPublicResultDto` 与 `createFullResultDto` 独立白名单序列化。
- `/api/pay` 与 `/pay` Mock 支付接口行为一致。
- 支付事件与订阅激活同事务，支付键全局幂等。
- 支付前 `LOCKED`，支付后及刷新后保持 `FULL`。

### M5：产品 UI — 完成

- 已完成面向客户的全链路视觉重设计：落地页、测评准备页、七步单题流程、基础报告与完整报告保持一致。
- 采用深森林绿、暖石色、能量青柠与少量珊瑚色，形成优雅运动感、高级简约的品牌语言。
- 统一页面进入、步骤切换、轨道图形与 SVG 趋势曲线动效，并支持 `prefers-reduced-motion`。
- 客户可见界面不展示开发、架构、API、数据库、算法版本、测试或支付实现类文案。
- 保留进度、自动保存、返回修改、错误重试、锁定/完整报告与非医疗建议声明。

### M6：质量与交付 — 完成

- Vitest 覆盖算法、Schema、恢复、幂等、乐观锁、并发、脱敏和支付。
- Playwright 覆盖创建、填写、刷新恢复、提交、支付和持续权限。
- CI 使用 PostgreSQL 16 执行 Quality 与 E2E Jobs。
- Docker Compose、Nginx、Migration、备份、部署与演示脚本齐备。
- GitHub 文档提供简体中文、English 和 AI 友好入口。

## 3. 当前部署状态

- 公网演示：<http://82.22.31.80>
- 健康探针：<http://82.22.31.80/api/health>
- GitHub 主分支：`main`
- 服务器目录：`/opt/health-assessment-funnel`
- 运行拓扑：Nginx + Next.js standalone + Prisma Migration + PostgreSQL 16。
- 当前为临时 HTTP/IP 模式，`COOKIE_SECURE=false`，仅允许虚构测试数据。

发布验收命令：

```bash
npm run db:validate
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm audit --audit-level=high
```

## 4. 真实生产加固待办

这些事项不阻塞当前挑战验收，但在收集真实用户数据或公开推广前必须完成。

### P0：域名、HTTPS 与访问安全

1. 配置正式域名和可信 TLS 证书。
2. 强制 HTTP → HTTPS。
3. 设置 `COOKIE_SECURE=true` 并验证 Cookie 属性。
4. 确认 SSH Key 可用后禁用 root 密码登录，并轮换已共享密码。
5. 增加速率限制、WAF/边缘防护和安全事件监控。

### P1：隐私、合规与产品责任

1. 形成隐私政策、用户同意、数据保留与删除机制。
2. 完成适用地区的健康数据和隐私法律审查。
3. 对所有健康文案和算法声明做专业审查；维持“非医疗建议”定位。
4. 禁止在日志、Issue、Demo 数据或测试夹具中写入真实健康信息。

### P1：可靠性与运维

1. 将数据库备份复制到异机或对象存储并定期恢复演练。
2. 接入集中日志、可用性监控和告警。
3. 建立数据库容量、磁盘和证书到期告警。
4. 制定 Migration 回滚、灾难恢复和事故响应流程。
5. 如接入真实支付，替换 Mock 支付并完成 Webhook 签名、对账和退款流程。

## 5. 主要风险

| 风险 | 当前控制 | 后续动作 |
| --- | --- | --- |
| 未付费结果泄漏 | 独立白名单 DTO + 防泄漏测试 | 契约变化时持续回归 |
| 多标签并发覆盖 | 乐观锁版本 + 409 恢复 | 保留真实数据库并发测试 |
| 重试造成重复写/支付 | Payload Hash + 幂等事件 | 监控冲突率与异常重放 |
| 健康信息被误解为医疗建议 | 页面与文档声明 | 专业和法律审查 |
| HTTP/IP Cookie 安全不足 | 仅虚构数据 | 配置域名、TLS、Secure Cookie |
| 单机故障 | 本地备份脚本 | 异地备份、恢复演练与告警 |

## 6. Definition of Done

挑战交付完成标准：

- 核心流程可通过真实 API 和浏览器端到端运行。
- 安全、权限、幂等与并发约束有自动化证据。
- Prisma 校验、Lint、Typecheck、测试、Build 和 E2E 通过。
- GitHub、CI、公网演示、健康探针和重放脚本可用。
- 中英文 README、完整文档与 AI Quickstart 同步。
- 仓库不包含生产 Secret 或真实健康数据。

外部人工动作仍需候选人完成：填写真实姓名，并按 [提交清单](SUBMISSION.md) 向指定邮箱发送材料。
