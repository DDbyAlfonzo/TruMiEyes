# TruMiEyes Photo-Book Ordering

TruMiEyes is a full-stack photo-book ordering workflow for admins and clients. Admins can upload layouts and images, share projects, and track selections. Clients can choose a layout, select images, and submit for approval.

## Tech Stack
- Next.js (pages router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- NextAuth (credentials)

## Features
- Admin dashboard + project management
- Client dashboard + project selection flow
- Layout gallery + image selection UI
- Role-based authentication
- API routes for CRUD
- Password reset + admin invite flow
- Google Cloud Storage uploads with signed asset access

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env.local` file (see `.env.example`).
3. Run database migrations:
   ```bash
   npm run db:migrate
   ```
4. Seed sample data:
   ```bash
   npm run db:seed
   ```
5. Start the dev server:
   ```bash
   npm run dev
   ```

## Environment Notes
- `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` are required for local auth to work.
- Google Cloud Storage env vars are required for admin uploads and signed asset URLs.
- The seed script uses bundled public images so the sample project can render locally even before a bucket is configured.

## Sample Accounts
- Admin: `admin@trumieyes.com` / `admin123`
- Client: `client@trumieyes.com` / `client123`

## Scripts
- `npm run dev` – start dev server
- `npm test` – run workflow rule regression tests
- `npm run verify:ci` – run the same checks used in CI
- `npm run db:migrate` – run Prisma migrations
- `npm run db:seed` – seed sample data

## Project Structure
- `pages/` – routes (admin, client, projects)
- `pages/api/` – API routes (auth, admin, selections, upload)
- `prisma/` – schema + seed
- `lib/` – shared utilities

## Notes
- Uploads use Google Cloud Storage with signed URLs. Only admins can upload; clients get signed access.
- If GCS is not configured, seeded sample assets still render, but uploading new files is disabled.
- CI uses `NEXT_DIST_DIR=.next.ci` so verification builds do not collide with local dev output.
