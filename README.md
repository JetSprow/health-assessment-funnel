# Health Assessment Funnel

[**简体中文**](README.zh-CN.md) · [**English**](README.en.md) · [**AI Quickstart / AI 快速上手**](AI_QUICKSTART.md)

[![CI](https://github.com/JetSprow/health-assessment-funnel/actions/workflows/ci.yml/badge.svg)](https://github.com/JetSprow/health-assessment-funnel/actions/workflows/ci.yml)

## 中文

这是一个具备完整工程闭环的健康测评体验。客户可以完成七步问卷、中断后恢复进度、获取个性化状态参考，并解锁完整趋势报告。前端采用优雅运动感的高级简约视觉系统，客户界面不展示开发或实现细节。

核心能力：

- Next.js 16 App Router + TypeScript
- Prisma 7 + PostgreSQL 16
- 分步持久化、幂等请求和乐观锁
- 服务端 BMI、热量、目标日期和趋势计算
- 未付费脱敏 DTO 与付费完整 DTO
- Vitest、真实 PostgreSQL API 测试和 Playwright 移动端 E2E
- 优雅运动感、丝滑动效与移动端优先的客户体验
- Docker Compose、Nginx 和 GitHub Actions

快速启动：

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run dev
```

完整中文说明请阅读 [README.zh-CN.md](README.zh-CN.md)，AI 或 Coding Agent 请先阅读 [AI 快速上手](docs/zh-CN/AI_QUICKSTART.md)。

## English

This repository implements a production-shaped health-assessment experience. Customers can complete seven steps, restore interrupted progress, receive a personalized status reference, and unlock a complete trend report. The customer UI uses a premium, minimal athletic visual system and never exposes implementation-oriented copy.

Core capabilities:

- Next.js 16 App Router and TypeScript
- Prisma 7 and PostgreSQL 16
- Incremental persistence, idempotency and optimistic locking
- Server-side BMI, calorie, target-date and projection calculations
- Explicit locked and full result DTOs
- Vitest, real-PostgreSQL API checks and mobile Playwright E2E
- Premium athletic styling, fluid motion and a mobile-first customer experience
- Docker Compose, Nginx and GitHub Actions

Quick start:

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run dev
```

Read [README.en.md](README.en.md) for the complete English guide. AI and coding agents should begin with the [AI-friendly Quickstart](docs/en/AI_QUICKSTART.md).

## Links / 链接

- Live demo / 在线演示: <http://82.22.31.80>
- Health probe / 健康探针: <http://82.22.31.80/api/health>
- Documentation / 文档中心: [docs/README.md](docs/README.md)
- Demo replay / 演示重放: `./scripts/demo-flow.sh`

> Demo data only. The current HTTP/IP environment must not be used for real health information. / 当前 HTTP/IP 环境仅允许使用虚构演示数据，不得填写真实健康信息。
