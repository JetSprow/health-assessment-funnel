**简体中文** · [English](../en/DEMO.md) · [文档中心](README.md)

# 演示与重放指南

## 公网环境

- 应用：<http://82.22.31.80>
- 健康探针：<http://82.22.31.80/api/health>
- 部署日期：2026-07-15

当前验收环境使用临时 HTTP/IP 配置，只能使用虚构数据。真实生产发布前必须配置域名、可信 HTTPS 证书并设置 `COOKIE_SECURE=true`。

## 一条命令重放 LOCKED 到 FULL

仓库包含基于 cURL 的重放脚本。它会创建新的匿名身份、保存全部七步、提交测评、打印锁定结果、调用 `/pay`，再打印完整结果：

```bash
./scripts/demo-flow.sh
```

测试其他部署：

```bash
BASE_URL=http://localhost:3000 ./scripts/demo-flow.sh
```

依赖：Bash、cURL、Python 3。脚本使用临时 Cookie jar，并在退出时删除。

## 已支付验收 Session

以下 Session 只包含虚构测试数据，并已于 2026-07-15 通过 Mock 接口支付：

```text
sessionId: 64c41d64-1b86-4be9-b3be-f42a9b456dac
```

项目强制校验匿名用户归属，因此只有 `sessionId` 不足以读取结果。下面配套凭证仅作为**演示专用测试 Cookie**公开，不是生产 Secret：

```text
health_assessment_session=a6a1178c-4eaa-460f-8223-3fb9a7ff4154.ctKrNuC4Bwtm-SFFiOivPz-0rMbTlzA4pCUhTWoioBA
```

直接重放已支付结果：

```bash
curl --fail-with-body --silent --show-error \
  -H 'Cookie: health_assessment_session=a6a1178c-4eaa-460f-8223-3fb9a7ff4154.ctKrNuC4Bwtm-SFFiOivPz-0rMbTlzA4pCUhTWoioBA' \
  http://82.22.31.80/api/sessions/64c41d64-1b86-4be9-b3be-f42a9b456dac/result \
  | python3 -m json.tool
```

预期标记：

```json
{
  "data": {
    "access": "FULL",
    "subscriptionStatus": "ACTIVE"
  }
}
```

需要观察同一个新 Session 在支付前后的变化时，使用 `./scripts/demo-flow.sh`；只需快速检查已解锁响应时，使用固定 Session。

## Mock 支付接口

脚本调用挑战兼容路由：

```http
POST /pay
```

同时提供命名空间路由：

```http
POST /api/pay
```

两者均接收：

```json
{
  "sessionId": "uuid",
  "idempotencyKey": "unique-key-at-least-8-characters"
}
```
