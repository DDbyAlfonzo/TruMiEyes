# TruMiEyes Galleries

Private photo proofing for TruMiEyes clients — a picdrop-style PWA where clients open their gallery with a link + code, heart and label photos, leave notes, and send their photo-book selection to the studio.

## Tech stack
- Next.js 15 (pages router) · TypeScript · Tailwind CSS
- Prisma ORM · PostgreSQL
- NextAuth (studio email/password + client gallery link/code)
- Cloudinary (photo storage and renditions)
- Firebase App Hosting

## What clients get
- **Link + 6-digit code access** at `/g/<slug>` — no account or password. Five wrong codes pause the link for 15 minutes.
- **Light, photo-first gallery** with a sticky filter bar (All · Favourites · Labelled · Comments) and photo-book progress.
- **Proofing lightbox**: favourite, colour labels (Must print · Retouch · Black & white), notes per photo, downloads, keyboard shortcuts (← → F 1–3 Esc) and swipe.
- **Review & send**: choose a book layout, add notes, send to the studio (selection locks until the studio reopens it).
- **Installable PWA**: home-screen install, offline fallback page, viewed photos cached on the device (cleared on sign-out).

## What the studio gets
- Admin dashboard: projects, uploads, layouts, users, status and change requests.
- **Client link card** on each project: create/rotate the link + code (shown once) and copy a ready-to-send message.
- Client labels shown next to their favourites.

## Brand
Colours from the Tru Mi Eyes logo sheet: red `#D22027`, ink `#231F20`, charcoal `#393536`. The logo's Avenir Next is licensed, so the UI uses **Nunito Sans** as the closest open alternative. Logo SVGs live in `public/brand/`; app icons use the TME bar mark.

## Local setup
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill it in.
3. `npm run db:migrate` then `npm run db:seed`
4. `npm run dev`

Seed accounts: `admin@trumieyes.com` / `admin123` and `client@trumieyes.com` / `client123` (local only).

## Deploying to Firebase App Hosting
1. Create a Postgres database (e.g. Neon or Supabase) and a Cloudinary account.
2. In the Firebase console (project `trumieyesapp`), create an **App Hosting backend** connected to this GitHub repo, live branch `main`.
3. Create the secrets referenced in `apphosting.yaml`:
   ```bash
   firebase apphosting:secrets:set trumieyes-database-url
   firebase apphosting:secrets:set trumieyes-nextauth-secret        # openssl rand -base64 32
   firebase apphosting:secrets:set trumieyes-admin-temp-password
   firebase apphosting:secrets:set trumieyes-admin-invite-token
   firebase apphosting:secrets:set trumieyes-cloudinary-cloud-name
   firebase apphosting:secrets:set trumieyes-cloudinary-api-key
   firebase apphosting:secrets:set trumieyes-cloudinary-api-secret
   firebase apphosting:secrets:set trumieyes-smtp-host
   firebase apphosting:secrets:set trumieyes-smtp-user
   firebase apphosting:secrets:set trumieyes-smtp-pass
   ```
   Then grant the backend access: `firebase apphosting:secrets:grantaccess <secret> --backend <backend-id>`.
4. Check the plain values in `apphosting.yaml` (`NEXTAUTH_URL`, `PRODUCTION_ADMIN_EMAIL`, `NEXT_PUBLIC_STUDIO_CONTACT_NAME`).
5. Push to `main`. The build runs migrations, makes sure the studio admin exists, then builds Next.js.
6. Add the custom domain (e.g. `app.trumieyes.co.za`) under App Hosting → Settings → Domains and add the DNS records it shows at the domain host.

## Scripts
- `npm run dev` – dev server
- `npm test` – workflow + gallery-access rule tests
- `npm run verify:ci` – tests + production build (CI)
- `npm run build:apphosting` – production build used by Firebase App Hosting
- `npm run db:migrate` / `npm run db:seed`

## Project structure
- `pages/` – routes (`/g/[slug]` access, `/client`, `/projects/[id]`, `/admin/*`)
- `pages/api/` – auth, favourites, labels, comments, selections, admin APIs
- `components/gallery/` – client gallery UI (header, toolbar, tiles, lightbox, review sheet, code input)
- `lib/` – auth rules, gallery access, storage, labels, PWA helpers
- `public/sw.js` – service worker · `public/brand/` – logo assets
- `prisma/` – schema, migrations, seed
