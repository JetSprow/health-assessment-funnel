# AI Quickstart / AI 快速上手

[简体中文完整版](docs/zh-CN/AI_QUICKSTART.md) · [Full English Guide](docs/en/AI_QUICKSTART.md) · [Documentation / 文档中心](docs/README.md)

This is the repository entry point for AI coding agents. 本文件是 AI Coding Agent 的仓库入口。

## Read first / 优先阅读

1. `AGENTS.md` — Next.js 16 version-sensitive rules / 版本敏感规则。
2. This language-specific AI guide / 对应语言的 AI 指南。
3. `prisma/schema.prisma` — authoritative data model / 权威数据模型。
4. `src/domain/assessment/` — validation, calculation and DTO boundary / 校验、计算和 DTO 边界。
5. The closest Route Handler and tests / 最相关的路由与测试。

## Non-negotiable invariants / 不可破坏的约束

- Raw anonymous tokens stay only in HttpOnly Cookies; PostgreSQL stores hashes. / 原始匿名 Token 只在 HttpOnly Cookie，数据库仅存 Hash。
- Every Session/result/payment operation verifies ownership. / 所有 Session、结果和支付操作必须校验归属。
- Step saves require idempotency and optimistic versions. / 分步保存必须保留幂等与乐观锁。
- Health calculations run and persist on the server. / 健康计算必须在服务端执行并持久化。
- Locked and full results use separate allow-listed DTOs. / 锁定与完整结果必须使用独立白名单 DTO。
- Payment creation and subscription activation remain transactional. / 支付事件和订阅激活必须保持同事务。
- Do not hand-edit `src/generated/prisma/`. / 不得手改 Prisma 生成文件。
- Never commit secrets, server passwords or real health data. / 禁止提交 Secret、服务器密码或真实健康数据。
- Update both `docs/en/` and `docs/zh-CN/`. / 文档变更必须同步中英文。

## Quality gate / 质量门禁

```bash
npm run db:validate
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm audit --audit-level=high
git diff --check
```

For framework changes, read the relevant local Next.js guide in `node_modules/next/dist/docs/` before editing. 修改框架相关代码前，先阅读本地 Next.js 版本文档。
