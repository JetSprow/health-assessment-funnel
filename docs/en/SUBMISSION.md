[简体中文](../zh-CN/SUBMISSION.md) · **English** · [Documentation Index](README.md)

# Submission Checklist and Email Template

## Manual items

The candidate must provide their real name and send the final submission. These identity and external-email actions cannot be completed safely from the repository alone.

Document name required by the challenge:

```text
【姓名】_全栈挑战_20260715
```

Recipients:

```text
yitengruntu12123@gmail.com
alex@arkon-tech.com
rip@arkon-tech.com
```

## Final checklist

- [ ] Replace `姓名` with the candidate's real name.
- [ ] Confirm <http://82.22.31.80> opens in an incognito browser.
- [ ] Confirm <http://82.22.31.80/api/health> reports `database: connected`.
- [ ] Confirm the latest GitHub Actions run is green.
- [ ] Run `./scripts/demo-flow.sh` once and confirm `LOCKED` changes to `FULL`.
- [ ] Verify the prepaid Session in `docs/en/DEMO.md` still returns `FULL`.
- [ ] Send the email to all three recipients.

## Suggested email

Subject:

```text
【姓名】_全栈挑战_20260715
```

Body:

```text
您好，以下是我的全栈开发 3 天挑战交付：

线上演示：
http://82.22.31.80

GitHub：
https://github.com/JetSprow/health-assessment-funnel

健康探针：
http://82.22.31.80/api/health

已支付测试 sessionId：
64c41d64-1b86-4be9-b3be-f42a9b456dac

/pay 的完整 cURL 重放方式、配套测试 Cookie、测试覆盖、数据库 Schema 图和 AI 使用复盘均已写入 README 与 docs/。

说明：当前演示环境为 HTTP/IP，仅用于虚构数据和技术验收；生产使用前需接入域名与 HTTPS。

谢谢。
```
