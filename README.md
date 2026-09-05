# Urban Furniture Accounting System

Next.js (App Router) frontend on top of the Express + Prisma accounting backend.

## Running locally

Backend (port 5000):

```bash
cd backend && npm run dev
```

Frontend (port 3000):

```bash
npm run dev
```

The frontend reads the API base URL from `NEXT_PUBLIC_API_URL` (see `.env.local`,
default `http://localhost:5000/api`).

Seeded accounts: `admin001 / Admin@12345`, `accountant001 / Accountant@12345`,
`user001 / User@12345`.

## Frontend structure

```
src/app/          routes - (auth) sign-in pages, (internal) staff app, portal/ customer portal
src/components/   ui/ primitives, layout/ shell + guards, forms/ shared document forms
src/services/     one file per backend module - all API calls live here
src/lib/          centralised API client (auth header, error normalisation, 401 handling)
src/context/      AuthContext (session + role), ToastContext (feedback)
src/hooks/        useApiResource (load/empty/error), useSubmit (mutations), usePortalInvoices
src/utils/        formatting helpers and shared constants
```

## Rules the frontend follows

- The backend is the source of truth for every total, status and balance. The UI
  only sums values the backend returned; line editors show a labelled preview
  before save.
- Payment status is never set from the client - it is derived by the backend from
  payment allocations.
- Role access is enforced per route (`RouteGuard`), not just by hiding menu items.
  The backend remains the final authority.

## Checks

```bash
npm run lint
npm run build
cd backend && node test-api.js && node test-master-data.js && node test-sales.js && node test-purchase.js && node test-accounting-budget.js && node test-reports.js
```
