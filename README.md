# Support Desk Client

Next.js (App Router) + TypeScript + Tailwind client for the Support Desk API.

## Run locally

1. Start the backend API (separate repo) — note its port.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` to the backend's URL.
3. `npm install`
4. `npm run dev`

## Seeded accounts

See the backend README for seeded email/password combinations for each role
(customer, agent, admin).

## Tests

Runs 5 component specs with `fetch` mocked — no backend needed.

## Architecture notes

- `lib/api.ts` — the only module that calls `fetch`.
- `lib/session.ts` — the only module that touches browser storage.
- `lib/permissions.ts` — what each role may do, in one place.
- `lib/transitions.ts` — the ticket status machine, as data.
- Filters, search, sort, and page all live in the URL query string.