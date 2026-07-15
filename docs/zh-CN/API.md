**简体中文** · [English](../en/API.md) · [文档中心](README.md)

# API 契约

所有成功响应统一使用：

```json
{
  "data": {},
  "meta": { "requestId": "uuid" }
}
```

错误响应统一使用：

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "可读错误信息",
    "details": {}
  },
  "meta": { "requestId": "uuid" }
}
```

## 身份认证

`POST /api/sessions` 会设置 `health_assessment_session` HttpOnly Cookie。所有 Session、结果和支付操作都通过该 Cookie 鉴权，并校验资源归属。

## 接口

### `GET /api/health`

运行时与数据库就绪探针。

### `POST /api/sessions`

新浏览器会创建匿名 User 和 Assessment Session，并设置 30 天 HttpOnly Cookie。已有匿名用户若仍有未完成测评，则返回原 Session 和 `resumed: true`，避免覆盖已保存进度。

状态码：新建为 `201 Created`，恢复未完成 Session 为 `200 OK`。

### `GET /api/sessions/current`

根据 HttpOnly 匿名 Cookie 返回最近一次测评的 Session、状态、当前步骤、版本和已保存 Profile。没有有效匿名身份或历史测评时返回：

```json
{ "currentSession": null }
```

### `GET /api/sessions/{sessionId}/progress`

恢复 Profile、当前步骤和乐观锁版本。

可能状态码：`200`、`400`、`401`、`404`、`500`、`503`。

### `PATCH /api/sessions/{sessionId}/steps/{stepKey}`

```json
{
  "requestId": "gender-unique-request-id",
  "version": 0,
  "data": { "gender": "FEMALE" }
}
```

步骤键与 Payload：

| Key | Payload |
| --- | --- |
| `gender` | `{ "gender": "MALE" \| "FEMALE" }` |
| `goal` | `{ "goal": "LOSE_WEIGHT" \| "GAIN_WEIGHT" \| "MAINTAIN_WEIGHT" }` |
| `age` | `{ "age": 18..80 }` |
| `height` | `{ "heightCm": 120..230 }` |
| `weight` | `{ "weightKg": 35..300 }` |
| `target-weight` | `{ "targetWeightKg": 35..300 }` |
| `activity` | `{ "activityLevel": "SEDENTARY" \| "LIGHT" \| "MODERATE" \| "ACTIVE" \| "VERY_ACTIVE" }` |

冲突语义：

- 完全相同的请求重放：`200`，`duplicated: true`。
- 同一 request ID 携带不同 Payload：`409 IDEMPOTENCY_CONFLICT`。
- 旧版本：`409 VERSION_CONFLICT`。
- 完成后继续提交答案：`409 ASSESSMENT_COMPLETED`。

### `POST /api/sessions/{sessionId}/submit`

```json
{ "version": 7 }
```

在同一事务中校验完整的持久化 Profile，并保存带版本号的计算结果。

可能状态码包括 `422 INCOMPLETE_ASSESSMENT` 和 `409 VERSION_CONFLICT`。

### `GET /api/sessions/{sessionId}/result`

锁定响应：

```json
{
  "access": "LOCKED",
  "subscriptionStatus": "INACTIVE",
  "summary": { "bmi": 25.71, "category": "OVERWEIGHT" },
  "lockedSections": ["recommendedCalories", "targetDate", "projectionCurve"]
}
```

完整响应会增加建议热量、目标日期、预测曲线、封顶标志、算法版本和计算时间。

### `POST /api/pay` 与 `POST /pay`

```json
{
  "sessionId": "uuid",
  "idempotencyKey": "payment-demo-001"
}
```

同一个 Key 与 Session 会返回原始成功 Payment Event。使用同一个 Key 支付另一个 Session 会返回 `409 IDEMPOTENCY_CONFLICT`。
