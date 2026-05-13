# Ruhul Quddus & Jurists — Practice Management System

A complete practice management application built for **Ruhul Quddus & Jurists**, a leading Bangladeshi law firm. Frontend in React; backend in Node.js + Express + PostgreSQL.

---

## Architecture

```
┌─────────────────┐       HTTPS       ┌─────────────────┐       TCP        ┌─────────────────┐
│  React frontend │ ─────────────────▶│ Node.js + Express│ ──────────────▶│   PostgreSQL    │
│  (Vite, static) │  REST + JWT auth  │   API (port 4000)│                  │ (port 5432)     │
└─────────────────┘                   └─────────────────┘                  └─────────────────┘
       Netlify/Nginx                       VPS / Render                       Self-hosted on VPS
```

- **All data lives in Postgres.** No localStorage data layer. Director's PC and employee laptops all see the same data.
- **Auth is JWT-based** with bcryptjs password hashing.
- **Role-based access control enforced at the API layer.** Employees can only see invoices where they handled at least one line item; only directors can create clients/invoices.
- **Frontend is a static SPA** that polls the API every 15 seconds to pick up changes from other devices.

---

## Default Login Credentials

⚠️ **Change these in production.** They are bootstrapped only for first-run access.

| Username | Password | Role |
|---|---|---|
| `director` | `rq2026` | Director (Ruhul Quddus Kazal) |
| `ar.murad` | `murad2026` | Senior Associate (Akter Rasul Murad) |
| `m.billah` | `billah2026` | Senior Associate (Md. Mosaddek Billah) |
| `a.hossain` | `hossain2026` | Associate (Md. Anwar Hossain) |
| `s.tuhin` | `tuhin2026` | Associate (Md. Salahuddin) |
| `s.islam` | `islam2026` | Associate (Syful Islam) |
| `d.chapa` | `chapa2026` | Associate (Dulon Chapa) |
| `i.monika` | `monika2026` | Associate (Israt Jahan Monika) |
| `h.rahman` | `rahman2026` | Associate (Habibur Rahman) |
| `m.islam` | `research2026` | Research Associate (Md. Muzahidul Islam) |

---

## Deployment Guide (VPS)

You'll need **one VPS** (Ubuntu 22.04+, 1GB RAM minimum) running Postgres + Node API + Nginx.

### Step 1 — Install everything

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y postgresql postgresql-contrib nodejs npm nginx
```

### Step 2 — Set up PostgreSQL

```bash
sudo -u postgres createuser rqj_user --pwprompt        # set a strong password
sudo -u postgres createdb rqj_db -O rqj_user
```

### Step 3 — Deploy the backend

```bash
unzip rq-jurists-app.zip
cd rq-app/server
cp .env.example .env
nano .env
```

Edit `.env`:
```
DATABASE_URL=postgresql://rqj_user:YOUR_STRONG_PASSWORD@localhost:5432/rqj_db
PORT=4000
NODE_ENV=production
JWT_SECRET=<generate-with-the-command-below>
JWT_EXPIRES_IN=12h
CORS_ORIGIN=https://app.your-domain.com
```

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Install, bootstrap, and start:
```bash
npm install
npm run bootstrap                # creates tables + 14 employees + 10 users
npm start                        # foreground; or use pm2 for production:
sudo npm install -g pm2
pm2 start src/index.js --name rqj-api
pm2 save && pm2 startup
```

The API now responds at `http://YOUR_SERVER:4000/health`.

### Step 4 — Deploy the frontend

```bash
cd ..                            # back to rq-app/
echo "VITE_API_BASE=https://api.your-domain.com" > .env.production
npm install
npm run build
sudo cp -r dist/* /var/www/rqjurists/
```

### Step 5 — Configure Nginx

Create `/etc/nginx/sites-available/rqjurists`:
```nginx
server {
    listen 80;
    server_name app.your-domain.com;
    root /var/www/rqjurists;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
    location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
}

server {
    listen 80;
    server_name api.your-domain.com;
    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable, reload, and add HTTPS:
```bash
sudo ln -s /etc/nginx/sites-available/rqjurists /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d app.your-domain.com -d api.your-domain.com
```

Done. Visit `https://app.your-domain.com` and log in.

---

## Local Development

```bash
# 1. Backend (PostgreSQL must be running locally)
cd server
cp .env.example .env
npm install
npm run bootstrap
npm run dev                      # API on :4000

# 2. Frontend (in another terminal)
cd ..
echo "VITE_API_BASE=http://localhost:4000" > .env.local
npm install
npm run dev                      # opens at http://localhost:5173
```

---

## API Reference

All endpoints (except `/health` and `/api/auth/login`) require `Authorization: Bearer <token>`.

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/health` | public | DB connectivity check |
| POST | `/api/auth/login` | public | Returns `{ token, user }` |
| GET | `/api/auth/me` | any | Current user info |
| GET | `/api/employees` | any | All 14 employees |
| GET | `/api/clients` | any | All clients with outstanding |
| POST | `/api/clients` | director | Create a client |
| PUT | `/api/clients/:id` | director | Update a client |
| GET | `/api/invoices` | any | RBAC-filtered list of invoices |
| POST | `/api/invoices` | director | Create an invoice |
| POST | `/api/invoices/:id/payments` | any | Record a payment (employees only on their own invoices) |

---

## Database Schema

| Table | Purpose |
|---|---|
| `employees` | 14 staff (e1–e14, hardcoded list) |
| `users` | 10 login accounts mapped to employees, with bcrypt password hashes |
| `clients` | UUID-keyed clients with name, address, contact, email, phone |
| `invoices` | Invoice headers with denormalized client_name and computed status |
| `invoice_items` | Line items, each with employee_id and amount — drives RBAC |
| `payments` | Payment history per invoice with method (cash/bkash) and receiver |

`invoice_items.employee_id` is the key field for role-based filtering. The employee invoice filter is:
```sql
WHERE EXISTS (
  SELECT 1 FROM invoice_items ii
  WHERE ii.invoice_id = i.id AND ii.employee_id = $current_employee_id
)
```

All foreign keys plus `issue_date`, `status`, `(year, month)`, and `username` are indexed.

---

## Changing a Password

```bash
cd server
node -e "
const bcrypt = require('bcryptjs');
const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(async () => {
  const hash = await bcrypt.hash('NEW_PASSWORD_HERE', 10);
  await client.query('UPDATE users SET password_hash=\$1 WHERE username=\$2', [hash, 'director']);
  console.log('Password updated');
  await client.end();
});
"
```

---

## Backup

PostgreSQL backups should be taken at least daily. Add to crontab:
```
0 3 * * * pg_dump -U rqj_user rqj_db | gzip > /backups/rqj-$(date +\%Y\%m\%d).sql.gz
```

Restore:
```bash
gunzip -c /backups/rqj-20260506.sql.gz | psql -U rqj_user rqj_db
```

---

## Tested

- 58 of 58 end-to-end API tests passing against real PostgreSQL
- All RBAC enforcement verified at the API layer (employees cannot create clients, cannot pay other people's invoices, cannot see invoices they didn't handle)
- Multi-item invoices correctly visible to all assigned employees
- Cross-device data sync verified via 15-second polling

---

**Built for Ruhul Quddus & Jurists.** Apple-inspired design · DM Sans + Hind Siliguri typography · BDT (৳) currency · Bangladesh-aware locale.
