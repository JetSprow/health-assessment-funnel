# Dedicated Server Deployment

## Topology

Docker Compose starts four services:

- `nginx`: public port 80 and security headers.
- `app`: non-root Next.js standalone runtime on the private network.
- `migrate`: one-shot Prisma migration container.
- `db`: PostgreSQL 16 with a named persistent volume; no public database port.

HTTPS should be enabled after a domain points to the server. Do not rely on a self-signed certificate for the public demo.

## Server prerequisites

- Debian/Ubuntu x86_64 server.
- At least 2 CPU, 2 GB RAM and 8 GB free disk.
- Docker Engine and Docker Compose plugin.
- Public inbound port 80; port 443 when a domain is configured.

## Install Docker on a fresh Debian server

The following uses Docker's official Debian repository rather than an unofficial package or a globally installed Compose binary:

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

## Initial deployment

```bash
mkdir -p /opt
cd /opt
git clone https://github.com/JetSprow/health-assessment-funnel.git
cd health-assessment-funnel

cp .env.production.example .env.production
openssl rand -hex 32
nano .env.production
# Use the generated hexadecimal value for POSTGRES_PASSWORD.
# Keep COOKIE_SECURE=false only while the site is served over plain HTTP.

chmod 600 .env.production

docker compose --env-file .env.production build --pull
docker compose --env-file .env.production up -d
docker compose --env-file .env.production ps
```

Verify:

```bash
curl --fail http://127.0.0.1/api/health
docker compose --env-file .env.production logs --tail=100 app nginx migrate db
```

## Updating

```bash
cd /opt/health-assessment-funnel
./scripts/deploy.sh
```

The script performs a fast-forward-only pull, rebuilds images, runs migrations through Compose dependencies and recreates changed services.

## Rollback

1. Record the current commit: `git rev-parse HEAD`.
2. Check out a known good commit.
3. Rebuild and run Compose.
4. Database migrations are forward-only; restore a backup if the failed release included a destructive migration.

```bash
git checkout <known-good-commit>
docker compose --env-file .env.production build
docker compose --env-file .env.production up -d
```

## Domain and HTTPS

After DNS is configured, replace the default Nginx server name and add a certificate using Certbot, or move TLS termination to a managed reverse proxy. Then:

- Redirect HTTP to HTTPS.
- Keep ports 80/443 open.
- Set `COOKIE_SECURE=true` in `.env.production` and redeploy.
- Confirm the anonymous Cookie includes `Secure`.
- Add HSTS only after HTTPS is verified end to end.
