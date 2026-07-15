# Operations Runbook

## Status and logs

```bash
cd /opt/health-assessment-funnel
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs -f --tail=200 app nginx
docker stats
```

Health probe:

```bash
curl --fail http://127.0.0.1/api/health
```

## Restart

```bash
docker compose --env-file .env.production restart app nginx
```

## Database backup

```bash
./scripts/backup.sh
```

Default backup location: `/opt/backups/health-assessment`. Default retention: 14 days.

Recommended cron entry:

```cron
17 3 * * * PROJECT_DIR=/opt/health-assessment-funnel /opt/health-assessment-funnel/scripts/backup.sh >> /var/log/health-assessment-backup.log 2>&1
```

Copy backups to a different machine or object storage; a backup on the same disk does not protect against server loss.

## Restore drill

```bash
cd /opt/health-assessment-funnel
set -a; source .env.production; set +a

docker compose --env-file .env.production stop app
cat /path/to/backup.dump | docker compose --env-file .env.production exec -T db \
  pg_restore --clean --if-exists -U "$POSTGRES_USER" -d "$POSTGRES_DB"
docker compose --env-file .env.production start app
```

Always test restore procedures on a disposable database first.

## Disk maintenance

```bash
df -h
docker system df
docker image prune -f
```

Do not run `docker system prune --volumes`; it can delete the PostgreSQL data volume.

## Incident checklist

1. Check `/api/health` and container status.
2. Inspect Nginx and app logs using the response `requestId` where available.
3. Check database health and disk space.
4. Stop rollout changes; preserve logs and a database backup.
5. Roll back the application commit if necessary.
6. Document timeline, impact, root cause and corrective actions.
