**简体中文** · [English](../en/AI_RETROSPECTIVE.md) · [文档中心](README.md)

# AI 辅助开发复盘

## 使用范围

AI 用于将挑战要求拆成可执行计划、初始化仓库、实现纵向功能、查阅框架版本文档、生成测试、执行命令并基于失败持续迭代。

## 高价值场景

1. **需求拆解**：将产品要求拆成持久化、算法、权限、支付与验收证据。
2. **框架适配**：在使用异步 `cookies()` 和 Promise 动态路由参数前核对 Next.js 16 文档。
3. **Schema 设计**：把幂等、乐观锁与结果可审计性落实为关系约束。
4. **测试生成**：覆盖边界、并发、脱敏和浏览器流程，而不只验证 Happy Path。
5. **快速反馈**：反复运行 Lint、TypeScript、Vitest、Build、API 冒烟和 Playwright。

## 保留人工判断的部分

- 选择模块化单体而非不必要的服务拆分。
- 将公开结果序列化视为白名单问题。
- 明确算法不构成医疗建议。
- 选择服务端持久化与计算作为信任边界。
- 拒绝公开暴露 PostgreSQL 的部署捷径。

## 发现并修复的问题

- 初版浏览器脚本在 UI 切换完成前点击下一个数值输入；增加显式问题断言后 E2E 可稳定复现。
- Playwright 起初使用 `127.0.0.1`，开发服务器却以 `localhost` 打开，触发 Next.js 开发来源限制；随后统一 Base URL。
- 首版泄漏断言把锁定区块名称视为泄漏值；修正为分别检查对象 Key 与受保护结果值。
- 步骤重放曾允许同一幂等键携带不同 Payload；随后增加 Payload Hash 与冲突处理。
- 已完成 Session 曾允许继续修改步骤；API 现已拒绝。
- Docker 依赖层曾在复制 Prisma Schema 前执行 `npm ci`，导致 `postinstall` 生成失败；现在安装依赖时跳过生命周期脚本，由 Builder 在完整源码就绪后生成 Prisma。
- 跳过依赖生命周期脚本曾导致 Migration 镜像没有缓存 Prisma Schema Engine；现在 Migrator 在镜像构建时生成，Migration 不依赖运行时下载。
- 临时纯 HTTP/IP 环境中，浏览器原生 `crypto.randomUUID()` 受安全上下文限制；客户端现使用 Web Crypto UUID Fallback，HTTPS 配置前也可工作。

## 局限与审查要求

AI 生成实现仍需人工审查隐私法律、医疗声明、真实支付、备份恢复和基础设施安全。测试通过只能证明约定行为，不代表临床或监管正确。

## 效率影响

最大效率收益来自产品、API、数据库与浏览器层之间的短反馈回路。最大质量收益来自先由 AI 枚举失败模式，再用自动化测试证明，而不是直接接受生成代码。

## 挑战要求的案例

### 数据库建模与 Mock 数据

AI 先枚举实体和失败模式，最终模型收敛为 `User`、`AssessmentSession`、`AssessmentProfile`、`AssessmentResult`、`Subscription`、`PaymentEvent`、`StepEvent`。生成的 Mock 数据覆盖减重、增重、维持、边界和支付场景；只有通过 API 同款 Zod 规则的数据才会被采用。

### 复杂逻辑与边界测试生成

AI 协助枚举健康计算分支、预测封顶、目标方向冲突、数值字段缺失、非有限值、重复请求、幂等键冲突、旧版本和并发写入，并将它们转换为确定性 Vitest 和真实 PostgreSQL Playwright API 测试。

### 一个被明确否决的提案/测试

曾有 AI 生成的泄漏测试仅因锁定响应列出了 `projectionCurve` 等锁定区块名称就失败。这个断言混淆了 UI 元数据和数据泄漏，因此被否决。替代测试分别检查响应对象 Key 与受保护哨兵值，只在私有结果数据实际被序列化时失败。
