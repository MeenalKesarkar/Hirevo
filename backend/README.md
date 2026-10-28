# Hirevo API

TypeScript + Express API with MongoDB Atlas, email/password authentication, rotating access/refresh tokens, and job listing endpoints.

## Setup

1. Open a terminal in `backend` and run `npm install`.
2. Copy `.env.example` to `.env` and set `MONGODB_URI` to the Atlas URI. Keep this file local and never commit it.
3. If Node reports `querySrv ECONNREFUSED`, set `MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1` in `.env` to use public DNS resolvers for Atlas SRV records.
4. Set different random values for `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` (at least 32 characters each).
5. In Atlas, allow the development machine's IP address under **Network Access**.
6. Run `npm run dev` to start the API at `http://localhost:4000`.
7. Run `npm run seed` to add three fictional demo jobs. Running the seed command again does not duplicate them.
8. Run `npm run seed:users` to create or refresh six demo candidate accounts and one recruiter account. They sign in with email. Each demo password is generated from the account name plus `123` and is bcrypt-hashed before it is saved to MongoDB.
9. Run `npm run users:remove-usernames` once to remove legacy username fields and their index from existing Atlas user records.

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
- `GET /api/posts` — authenticated feed, newest first.
- `POST /api/posts` — create a text post with an optional small image attachment; requires a bearer access token.
- `DELETE /api/posts/:postId` — delete your own post; admins can delete any post.

Refresh tokens are stored as SHA-256 hashes, rotated on refresh, and removed after expiry. Access tokens last 15 minutes; refresh tokens last 7 days.

Google sign-in uses Google Identity Services ID tokens verified by the backend. Create a Google OAuth **Web application** client, add `http://localhost:5173` as an authorized JavaScript origin, then set the same client ID as `GOOGLE_CLIENT_ID` in `backend/.env` and `VITE_GOOGLE_CLIENT_ID` in `frontend/.env.local`. Restart both servers after setting the values. No Google client secret is needed for this ID-token flow.

