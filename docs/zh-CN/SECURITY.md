**简体中文** · [English](../en/SECURITY.md) · [文档中心](README.md)

# 安全说明

## 已实现控制

- 匿名原始 Token 仅存在于 HttpOnly Cookie；PostgreSQL 只存储 SHA-256 Hash。
- Cookie 使用 HttpOnly、SameSite=Lax、Path 限定和 30 天有效期。生产代码默认启用 `Secure`，仅临时 HTTP/IP 演示允许显式关闭。
- 每个 Session 操作均校验已认证的资源归属。
- Zod 拒绝格式错误、非有限值、越界值和多余字段。
- PostgreSQL CHECK 约束提供第二道校验边界。
- Session version 防止并发静默覆盖。
- 步骤和支付幂等键防止重复命令处理。
- 公开与完整结果使用独立 DTO 构造器。
- PostgreSQL 只在 Docker 私有网络可用。
- 应用容器以非特权用户运行。
- Nginx 添加防点击劫持、MIME 嗅探、Referrer 和浏览器权限响应头。
- CI 执行依赖、类型、测试与构建检查；`npm audit` 当前无漏洞。

## 生产环境动作

- 仓库中的 Compose 示例为临时 HTTP/IP 部署设置 `COOKIE_SECURE=false`。配置 HTTPS 后必须立即改为 `COOKIE_SECURE=true`、重新部署，并在浏览器开发者工具中验证。
- 将所有示例 Secret 替换为随机生成值。
- `.env.production` 权限保持 `600`，且不得提交 Git。
- 轮换安装期间共享过的服务器密码。
- 优先使用 SSH Key；确认密钥登录后禁用 root 密码登录。
- 主机/云防火墙只开放 SSH、HTTP 和 HTTPS。
- 收集真实用户数据前必须启用 HTTPS。
- 公共推广前增加限流与监控。
- 将健康数据视为敏感数据，并定义删除与保留规则。

## 已知演示限制

- 支付为 Mock 接口，不得描述为真实收费。
- 测评算法未经临床验证。
- 不提供注册账户恢复；访问能力绑定匿名 Cookie。
- 当前未包含 WAF、分布式限流器或集中安全事件管道。

## 报告安全问题

不要在公开 Issue 中提交 Secret 或个人健康数据。发现凭证暴露后立即吊销，并通过私密渠道报告敏感问题。
