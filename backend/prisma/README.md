# Database — provisioning and deployment

PostgreSQL, managed with Prisma Migrate. Everything the database needs to exist
is in this folder, so a brand-new database can be brought up reproducibly.

```
prisma/
├── schema.prisma            the data model (28 tables, 16 enums)
├── migrations/
│   ├── migration_lock.toml  provider lock (postgresql)
│   └── 0_init/migration.sql the full schema as SQL
└── seed.js                  idempotent seed (core) + optional demo data
```

## Provisioning a new database

Point `DATABASE_URL` at an empty database and run:

```bash
npm ci
npm run db:setup      # prisma migrate deploy && node prisma/seed.js
```

`db:setup` is safe to re-run: `migrate deploy` only applies migrations that have
not run yet, and the seed uses upserts and existence checks throughout.

### What the seed creates

**Core (always)** — the minimum the application needs to function:

- 53 permissions and the `ADMIN` / `ACCOUNTANT` / `USER` roles
- three sign-in accounts (override the passwords via env — see below)
- the base chart of accounts (`400000` Product Sales, `500000` Goods Purchased,
  `100000` Bank, `120000` Receivable, `210000` Payable)
- the Sales, Purchase, Bank and Cash journals

**Demo (only when `SEED_DEMO_DATA=true`)** — contacts, products, budgets,
invoices, bills and payments generated with faker, for local development and
demos. Never enable this against production data.

```bash
npm run seed        # core only
npm run seed:demo   # core + demo records
```

Set `SEED_ADMIN_PASSWORD`, `SEED_ACCOUNTANT_PASSWORD` and `SEED_USER_PASSWORD`
in any real deployment. The built-in defaults are development credentials.

## Deploying on Render

1. Create a **PostgreSQL** instance. Copy the **Internal Database URL** if the
   web service runs in the same region, otherwise the External one.
2. Create a **Web Service** from this repo with root directory `backend`:
   - Build command: `npm ci && npm run migrate:deploy`
   - Start command: `npm start`
3. Set the environment variables from `.env.example` — at minimum
   `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`.
4. Seed once, from your machine, against the deployed database:

   ```bash
   DATABASE_URL="<render external url>" npm run seed
   ```

`postinstall` runs `prisma generate`, so the client is always built for the
deployment target's platform.

Hosted Postgres requires TLS. If the provider's URL does not already include it,
append `&sslmode=require`.

## Schema changes

```bash
npm run migrate:dev -- --name describe_your_change   # development
npm run migrate:deploy                               # production
npm run migrate:status                               # what has been applied
```

Commit the generated folder under `migrations/`. Never edit an applied
migration — add a new one.

## Baselining note

`0_init` was generated from the existing schema with `prisma migrate diff`
after the database had originally been created with `db push`. A database that
predates the migration history must be told the migration is already applied,
once:

```bash
npx prisma migrate resolve --applied 0_init
```

New databases need nothing — `migrate deploy` applies it normally.

## Resetting local data

```bash
psql -U postgres -c "DROP DATABASE IF EXISTS urban_furniture_fresh;"
psql -U postgres -c "CREATE DATABASE urban_furniture_fresh;"
npm run migrate:deploy && npm run seed:demo
```
