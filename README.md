# Paytrixx

Payment platform for Indian businesses: merchants integrate one API, customers pay on a hosted page
(processed through Paytm), and Paytrixx verifies, tracks and notifies.

```
backend/          Node + Express + MongoDB API (payments, webhooks, onboarding, admin)
paytrixx/web/     Vite + React — public site, docs, registration, merchant dashboard
paytrixx/admin/   CRA + MUI — internal admin panel (merchants, applications, payments, logs)
ecommerce/        (not built yet)
```

## Run locally

Requires Node 20+ and a MongoDB instance.

```bash
# 1. Backend
cd backend
cp .env.example .env        # fill MONGO_URI, JWT_SECRET, Paytm keys
npm install
npm run seed:admin          # needs SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in .env
npm run dev                 # http://localhost:5000

# 2. Website + merchant dashboard
cd paytrixx/web
cp .env.example .env        # VITE_API_BASE_URL=http://localhost:5000
npm install
npm run dev                 # http://localhost:5173

# 3. Admin panel
cd paytrixx/admin
cp .env.example .env        # REACT_APP_API_BASE_URL=http://localhost:5000
npm install --legacy-peer-deps
npm start                   # http://localhost:3000
```

Without `SMTP_HOST`, the email verification code is printed in the backend console.

## Flow

1. A merchant registers on the website (7 steps, email-verified) → status **submitted**.
2. An admin reviews it in the admin panel (**Merchants → Applications**) and approves or rejects it.
3. The merchant signs in, generates an API key in **Settings**, and sets a callback URL.
4. `POST /api/payment/create` (`x-api-key`) → redirect the customer to `paymentUrl`.
5. Paytm notifies `POST /api/webhook/paytm` → signature + amount verified → order marked paid
   (idempotent) → signed callback queued to the merchant (retried with backoff).

## Tests

```bash
cd backend && npm test      # spins up an in-memory MongoDB; Paytm is stubbed
```

## Production checklist

- Set `DATA_ENCRYPTION_KEY`, `JWT_SECRET`, real SMTP, and `PAYTM_HOST` for production.
- Point `BASE_URL` at your public API domain and register `BASE_URL/api/webhook/paytm` in the Paytm dashboard.
- Set `WEB_ORIGINS` / `ADMIN_ORIGINS` to your deployed front-end origins.
- Replace the placeholder domain `api.yourdomain.com` in `paytrixx/web/src/lib/samples.js` and `guides.js`.
