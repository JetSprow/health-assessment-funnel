**简体中文** · [English](../en/OPERATIONS.md) · [文档中心](README.md)

# 运维手册

## 状态与日志

```bash
cd /opt/health-assessment-funnel
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs -f --tail=200 app nginx
docker stats
```

健康探针：

```bash
curl --fail http://127.0.0.1/api/health
```

## 重启

```bash
docker compose --env-file .env.production restart app nginx
```

## 数据库备份

```bash
./scripts/backup.sh
```

默认备份目录：`/opt/backups/health-assessment`。默认保留 14 天。

建议 Cron：

```cron
17 3 * * * PROJECT_DIR=/opt/health-assessment-funnel /opt/health-assessment-funnel/scripts/backup.sh >> /var/log/health-assessment-backup.log 2>&1
```

应将备份复制到另一台机器或对象存储；同一磁盘上的备份不能防止服务器整体丢失。

## 恢复演练

```bash
cd /opt/health-assessment-funnel
set -a; source .env.production; set +a

docker compose --env-file .env.production stop app
cat /path/to/backup.dump | docker compose --env-file .env.production exec -T db \
  pg_restore --clean --if-exists -U "$POSTGRES_USER" -d "$POSTGRES_DB"
docker compose --env-file .env.production start app
```

恢复流程必须先在一次性数据库上演练。

## 磁盘维护

```bash
df -h
docker system df
docker image prune -f
```

不要运行 `docker system prune --volumes`，它可能删除 PostgreSQL 数据卷。

## 事故检查清单

1. 检查 `/api/health` 和容器状态。
2. 查看 Nginx 与应用日志；可用时按响应 `requestId` 追踪。
3. 检查数据库健康和磁盘空间。
4. 停止继续发布，保全日志并创建数据库备份。
5. 必要时回滚应用 Commit。
6. 记录时间线、影响、根因和修正措施。
