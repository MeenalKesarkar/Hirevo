# Hirevo API

TypeScript + Express API with MongoDB Atlas, email/password authentication, rotating access/refresh tokens, and job listing endpoints.

## Setup

1. Open a terminal in `backend` and run `npm install`.
2. Copy `.env.example` to `.env` and set `MONGODB_URI` to the Atlas URI. Keep this file local and never commit it.
3. Set different random values for `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` (at least 32 characters each).
4. In Atlas, allow the development machine's IP address under **Network Access**.
5. Run `npm run dev` to start the API at `http://localhost:4000`.
6. Run `npm run seed` to add three fictional demo jobs. Running the seed command again does not duplicate them.

The API selects the `hirevo` database from the URI. MongoDB creates it when data is first written.

## Routes

- `GET /api/health` — API and database availability.
- `POST /api/auth/register` — create a candidate account.
- `POST /api/auth/login` — receive an access token and an HTTP-only refresh cookie.
- `POST /api/auth/refresh` — rotate the refresh cookie and receive a new access token.
- `POST /api/auth/logout` — revoke the refresh token and clear the cookie.
- `GET /api/auth/me` — current account; requires `Authorization: Bearer <accessToken>`.
- `GET /api/jobs` and `GET /api/jobs/:jobId` — public job listings.
- `POST`, `PATCH`, `DELETE /api/jobs` — recruiter/admin job management; requires a bearer access token.

Refresh tokens are stored as SHA-256 hashes, rotated on refresh, and removed after expiry. Access tokens last 15 minutes; refresh tokens last 7 days.

The Google button on the frontend is not connected to OAuth yet. Google OAuth needs its client ID, callback URL, and provider configuration before it can authenticate users.

