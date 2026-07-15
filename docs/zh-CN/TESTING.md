**简体中文** · [English](../en/TESTING.md) · [文档中心](README.md)

# 测试策略

## 本地质量门禁

```bash
npm run db:validate
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm audit --audit-level=high
```

## Vitest 覆盖

- 确定性算法结果与目标日期。
- 维持体重时的零周行为。
- 拒绝零值、NaN 和 Infinity。
- 目标与目标体重方向校验。
- 260 周预测封顶。
- 严格增量 Schema 与字段边界。
- 进度恢复与 Decimal 序列化。
- 重复、过期、乱序和并发保存。
- 冲突的幂等键复用。
- 已完成 Session 拒绝变更。
- 不完整提交拒绝。
- 锁定 DTO 防止受保护字段泄漏。
- 支付幂等和 LOCKED 到 FULL 状态切换。
- 有无原生 `crypto.randomUUID()` 时的客户端 request ID 生成。

## Playwright 用户旅程

移动端 Chromium 测试执行：

1. 访问落地页并创建 Session。
2. 填写前三个答案。
3. 刷新浏览器并恢复到第四步。
4. 填写剩余答案并在服务端提交。
5. 断言报告处于锁定状态。
6. Mock 支付并断言完整报告。
7. 再次刷新并断言完整权限持久化。
8. 断言没有浏览器 Console 或页面错误。

## 生产发布验证

可直接对已部署环境运行同一移动端 Chromium 旅程和真实 PostgreSQL API 并发测试，而不启动本地 Web Server：

```bash
PLAYWRIGHT_BASE_URL=http://82.22.31.80 npm run test:e2e
```

该生产测试曾发现原生 `crypto.randomUUID()` 的安全上下文限制，并会验证完整的创建、保存、恢复、提交、支付、刷新，以及重放、乱序和并发版本处理。

## CI

Quality Job 运行静态与单元检查。独立 E2E Job 启动 PostgreSQL 16、部署 Migration、安装 Chromium，并用一个 Worker 执行浏览器旅程。

## 手工发布冒烟

- 使用无痕窗口测试。
- 验证移动端和桌面端布局。
- 在 Funnel 中途和支付后刷新。
- 验证直接访问其他 Session 会返回 404/未授权行为。
- 确认公网无法连接 PostgreSQL。
- HTTPS 启用后确认生产 Cookie 包含 HttpOnly、SameSite 和 Secure。
