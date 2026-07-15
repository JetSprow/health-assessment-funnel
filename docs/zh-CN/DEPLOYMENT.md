**简体中文** · [English](../en/DEPLOYMENT.md) · [文档中心](README.md)

# 专用服务器部署

## 当前演示部署

- 公网地址：<http://82.22.31.80>
- 健康探针：<http://82.22.31.80/api/health>
- 首次部署日期：2026-07-15
- 源分支：从 GitHub 拉取的 `main`
- 传输：临时 HTTP/IP 模式，`COOKIE_SECURE=false`

在域名、可信 TLS 证书和生产隐私/合规控制就绪前，不得向该演示环境提交真实健康信息。

## 拓扑

Docker Compose 启动四个服务：

- `nginx`：公网 80 端口和安全响应头。
- `app`：私有网络中的非 root Next.js standalone Runtime。
- `migrate`：一次性 Prisma Migration 容器。
- `db`：PostgreSQL 16，使用命名持久卷，不公开数据库端口。

域名解析到服务器后应启用 HTTPS。公网演示不要依赖自签名证书。

## 服务器要求

- Debian/Ubuntu x86_64。
- 至少 2 CPU、2 GB 内存和 8 GB 可用磁盘。
- Docker Engine 和 Docker Compose Plugin。
- 公网入站 80 端口；配置域名后开放 443。

## 在全新 Debian 安装 Docker

使用 Docker 官方 Debian 仓库：

```bash
apt-get update
apt-get install -y ca-certificates curl git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $VERSION_CODENAME stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker

docker version
docker compose version
```

## 首次部署

```bash
mkdir -p /opt
cd /opt
git clone https://github.com/JetSprow/health-assessment-funnel.git
cd health-assessment-funnel

cp .env.production.example .env.production
openssl rand -hex 32
nano .env.production
# 使用生成的十六进制值作为 POSTGRES_PASSWORD。
# 仅在纯 HTTP 环境中保持 COOKIE_SECURE=false。

chmod 600 .env.production

docker compose --env-file .env.production build --pull
docker compose --env-file .env.production up -d
docker compose --env-file .env.production ps
```

验证：

```bash
curl --fail http://127.0.0.1/api/health
docker compose --env-file .env.production logs --tail=100 app nginx migrate db
```

## 主机防火墙

当前专用服务器只允许已验证的 SSH 端口和 Web 端口。应用 3000 与 PostgreSQL 5432 不绑定到主机。

```bash
apt-get install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 782/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status verbose
```

启用防火墙前，必须确认两个 SSH 端口上的密钥登录均可用。

## 更新

```bash
cd /opt/health-assessment-funnel
./scripts/deploy.sh
```

脚本会执行仅快进拉取、重建镜像、通过 Compose 依赖运行 Migration，并重建有变化的服务。

## 回滚

1. 记录当前 Commit：`git rev-parse HEAD`。
2. 切换到已知正常 Commit。
3. 重建并启动 Compose。
4. 数据库 Migration 默认只向前；如果失败版本包含破坏性 Migration，需要恢复备份。

```bash
git checkout <known-good-commit>
docker compose --env-file .env.production build
docker compose --env-file .env.production up -d
```

## 域名与 HTTPS

DNS 配置后，修改 Nginx `server_name` 并使用 Certbot 添加证书，或将 TLS 终止迁移到托管反向代理。随后：

- 将 HTTP 重定向到 HTTPS。
- 保持 80/443 端口开放。
- 在 `.env.production` 中设置 `COOKIE_SECURE=true` 并重新部署。
- 确认匿名 Cookie 带有 `Secure`。
- 仅在端到端验证 HTTPS 后启用 HSTS。
