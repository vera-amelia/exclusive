# Vera Amelia — Membership Platform

Full-stack membership website inspired by the supplied reference screenshots, branded as **Vera Amelia**.

## Included

- Public landing page with pink editorial / premium visual style.
- Email + password registration and login.
- Secure HTTP-only JWT session cookie.
- Four configurable membership levels.
- Hierarchical access: purchasing a higher level automatically unlocks every lower level.
- 30-day subscription records created after successful payment webhook.
- Paymenku transaction creation + idempotency key.
- Paymenku webhook endpoint with HMAC verification when `PAYMENKU_WEBHOOK_SECRET` is configured.
- Admin dashboard with member, revenue, order, content and level stats.
- Admin content upload by image/video file or external URL.
- Cloudinary upload support, recommended for Railway because local disk is ephemeral.
- PostgreSQL + Prisma.
- Railway-ready and GitHub-ready.

## Local setup

1. Copy `.env.example` to `.env`.
2. Create a PostgreSQL database.
3. Set `DATABASE_URL` and a strong `JWT_SECRET`.
4. Set Cloudinary credentials if you want the admin file-upload feature.
5. Set Paymenku sandbox credentials.
6. Run:

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Default seeded admin comes from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Paymenku

The integration uses Paymenku's REST API endpoint `POST /transaction/create` through the configured `PAYMENKU_BASE_URL`. The project sends Bearer authentication and an `Idempotency-Key`, and stores the returned transaction/payment URL/QR string. Configure Paymenku to call:

`https://YOUR-DOMAIN/api/payments/webhook`

The exact webhook signature header should be confirmed against the merchant account's current Paymenku dashboard/documentation. This project accepts `x-paymenku-signature`, `x-signature`, or `signature` and verifies HMAC-SHA256 when `PAYMENKU_WEBHOOK_SECRET` is set.

## Railway deployment

1. Push this folder to a GitHub repository.
2. Create a Railway project and deploy from the repository.
3. Add a PostgreSQL service in Railway.
4. Add the environment variables from `.env.example`.
5. Set `NEXT_PUBLIC_APP_URL` to your Railway public URL.
6. Set Paymenku production key and webhook URL.
7. Deploy. The `start` command runs `prisma db push`, seeds the tiers/admin idempotently, then starts Next.js.

### Required production environment variables

- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `PAYMENKU_API_KEY`
- `PAYMENKU_BASE_URL=https://paymenku.com/api/v1`
- `PAYMENKU_WEBHOOK_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## Important production hardening

Before taking real payments, confirm the webhook signature header/secret from your Paymenku merchant account, add rate limiting to auth/payment endpoints, and use a strong unique `JWT_SECRET`. Never commit `.env` or payment credentials to GitHub.
