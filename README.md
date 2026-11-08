# Pharmacy System

Next.js 15 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Prisma · PostgreSQL.

Features: staff login, stock overview (reorder + expiry alerts), inventory management, point of sale with atomic stock deduction, sales history.

## Deploy on Vercel
1. Push this folder to a GitHub repo and import it in Vercel.
2. Create or connect a PostgreSQL database and make sure its environment variables are available to the Vercel project.
3. Add these environment variables in **Project Settings → Environment Variables** (see `.env.example`):
   - `DATABASE_URL` = the pooled URL (`POSTGRES_PRISMA_URL`)
   - `DIRECT_URL` = the direct, non-pooling PostgreSQL URL (`POSTGRES_URL_NON_POOLING`)
   - `ADMIN_PASSWORD` = a strong staff login password
   - `AUTH_SECRET` = a long, random secret
   - Optional: `NEXT_PUBLIC_CURRENCY`, `NEXT_PUBLIC_PHARMACY_NAME`
4. Before the first deployment, initialize the database schema once by running `npx prisma db push` from a trusted local terminal with `DATABASE_URL` and `DIRECT_URL` set to the production database. Do not run this command against production data unless you have reviewed the schema changes and have a backup.
5. Deploy. The Vercel build generates the Prisma client and builds the Next.js app; it does not connect to or modify the database. Set all required variables for each Vercel environment you deploy to.

## Continuous integration and deployment
- GitHub Actions runs `npm ci` and `npm run build` for pull requests targeting `main` and pushes to `main`. npm dependencies are cached using `package-lock.json`.
- CI uses placeholder environment values and does not connect to a database or access production secrets.
- Connect the GitHub repository to Vercel to get preview deployments for pull requests and production deployments from the configured production branch. Configure branch protection to require the **CI / build** check before merging to `main`.

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
