**简体中文** · [English](../en/SUBMISSION.md) · [文档中心](README.md)

# 提交检查清单与邮件模板

## 必须人工完成的事项

候选人必须填写真实姓名并亲自发送最终邮件。仅凭仓库无法安全完成身份确认和外部邮件操作。

挑战要求的文档名称：

```text
【姓名】_全栈挑战_20260715
```

收件人：

```text
yitengruntu12123@gmail.com
alex@arkon-tech.com
rip@arkon-tech.com
```

## 最终检查清单

- [ ] 将 `姓名` 替换为候选人真实姓名。
- [ ] 在无痕浏览器确认 <http://82.22.31.80> 可访问。
- [ ] 确认 <http://82.22.31.80/api/health> 返回 `database: connected`。
- [ ] 确认最新 GitHub Actions 全绿。
- [ ] 执行一次 `./scripts/demo-flow.sh`，确认 `LOCKED` 变为 `FULL`。
- [ ] 确认 `docs/zh-CN/DEMO.md` 的已支付 Session 仍返回 `FULL`。
- [ ] 向全部三个收件人发送邮件。

## 建议邮件

主题：

```text
【姓名】_全栈挑战_20260715
```

正文：

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
