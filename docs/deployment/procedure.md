# Deployment — Atelier Boterbloem

VPS: Strato `85.215.182.227` (Plesk, Apache, PM2). Zelfde server als `tcgdeckmaster` en `beautystudiodynamic`.

## Eenmalige setup

### 1. Postgres op VPS

```bash
ssh root@85.215.182.227
sudo -u postgres psql <<SQL
  CREATE USER abb_app WITH PASSWORD '<STERK_WACHTWOORD>';
  CREATE DATABASE atelierboterbloem OWNER abb_app;
  GRANT ALL PRIVILEGES ON DATABASE atelierboterbloem TO abb_app;
SQL
```

### 2. Firewall / poort 6778

Verifieer of poort 6778 extern bereikbaar is:

```bash
# Op je laptop:
nc -zv 85.215.182.227 6778
```

Als de poort dicht zit:
- Korte termijn: SSH-tunnel `ssh -L 6778:localhost:6778 root@85.215.182.227` en open `http://localhost:6778` lokaal.
- Lange termijn: maak een Apache reverse proxy via Plesk (bv. `boterbloem.tcgdeckmaster.com` → `localhost:6778`).

### 3. GitHub Deploy Key

```bash
# Op de VPS:
ssh-keygen -t ed25519 -f ~/.ssh/abb_deploy -N ""
cat ~/.ssh/abb_deploy.pub
# Plak deze key in GitHub repo > Settings > Deploy keys (read-only)

# SSH config:
cat >> ~/.ssh/config <<EOF
Host github-abb
  HostName github.com
  User git
  IdentityFile ~/.ssh/abb_deploy
  IdentitiesOnly yes
EOF
```

### 4. App folder

```bash
mkdir -p /projects
cd /projects
git clone github-abb:dutchecomgroup/boterbloem.git atelierboterbloem
cd atelierboterbloem
mkdir -p uploads/gallery logs

cp .env.example .env
nano .env
# Zet DATABASE_URL=postgresql://abb_app:<wachtwoord>@localhost:5432/atelierboterbloem
# Zet SESSION_SECRET (genereer met openssl rand -hex 48)
# Zet NODE_ENV=production

npm ci
# Eerste keer: schema opzetten. Daarna gaan wijzigingen via sql-pending/ — zie db-migraties.md
npm run db:push
npm run seed:admin

npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup    # volg de output
```

## Updates uitrollen

```bash
cd /projects/atelierboterbloem
git pull
npm ci
# Schema veranderd? .sql uit docs/deployment/sql-pending/ draaien — NIET db:push.
# Zie db-migraties.md; migratie altijd vóór de code.
npm run build
pm2 reload atelierboterbloem
```

## Logs / status

```bash
pm2 status
pm2 logs atelierboterbloem --lines 100
pm2 monit
```

## Backup

```bash
# Snel:
pg_dump -U abb_app atelierboterbloem | gzip > ~/backups/abb-$(date +%F).sql.gz

# Uploads:
tar czf ~/backups/abb-uploads-$(date +%F).tar.gz /projects/atelierboterbloem/uploads
```

> ⚠️ Neem **altijd** een `pg_dump` vóór een migratie — er is één database en die is live.
> Procedure: [db-migraties.md](db-migraties.md).

---

Verwante documentatie: [README.md](README.md) · [pending.md](pending.md) · [rollback.md](rollback.md) · [infra/domein.md](infra/domein.md)
