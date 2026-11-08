# Pharmacy System

Next.js 15 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Prisma · PostgreSQL.

Features: staff login, stock overview (reorder + expiry alerts), inventory management, point of sale with atomic stock deduction, sales history.

## Deploy on Vercel
1. Push this folder to a GitHub repo and import it in Vercel.
2. In the Vercel project: **Storage → Create → Postgres (Neon)**. Connect it to the project.
3. Add env vars (see `.env.example`):
   - `DATABASE_URL` = the pooled URL (`POSTGRES_PRISMA_URL`)
   - `DIRECT_URL` = the non-pooling URL (`POSTGRES_URL_NON_POOLING`)
   - `ADMIN_PASSWORD`, `AUTH_SECRET` (long random string), optional `NEXT_PUBLIC_CURRENCY`, `NEXT_PUBLIC_PHARMACY_NAME`
4. Deploy. The build creates the tables automatically (`prisma db push`).

## Run locally
```
cp .env.example .env   # fill in values
npm install
npx prisma db push
npm run dev
```

## Notes
- Prices are stored as integer cents.
- Single shared staff password. For multiple staff roles and audit trails, add per-user accounts (e.g. Auth.js) before storing patient data.
- This system tracks stock and sales only; it does not handle prescriptions or controlled-substance registers, which have legal requirements in most countries.
