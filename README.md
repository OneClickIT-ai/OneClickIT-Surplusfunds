# OneClickIT Surplus Funds

A Next.js application for surplus funds research and claims management, built by OneClickIT.

## Features

- Surplus funds search and tracking
- Claims management dashboard
- Stripe payment integration
- Admin panel with protected routes
- PDF export and reporting

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Stripe account
- Vercel account (for deployment)

### Setup

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy the environment variables template and fill in your values:

```bash
cp .env.example .env.local
```

3. Push the database schema:

```bash
npm run db:push
```

4. (Optional) Seed the database:

```bash
npm run db:seed
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Environment Variables

See `.env.example` for a full list of required environment variables. Key variables include:

- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — Secret for NextAuth session encryption
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — Stripe credentials

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run test` | Run Playwright e2e tests |

## Deployment

Deploy on [Vercel](https://vercel.com). Set all environment variables in the Vercel dashboard before deploying.
