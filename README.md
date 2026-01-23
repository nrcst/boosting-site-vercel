# Boosting Service Website

Production-ready Next.js 14 (App Router) website for customer order tracking and admin management.

## Features

- Customer landing page with order ID tracking, smooth scroll, and session gallery
- AJAX-only order lookup (no reloads)
- Progress tracking with expandable image gallery
- Admin panel at /admin (password protected)
- Order creation, updates, and session uploads
- Rate limiting for order checks via edge middleware
- Supabase-backed database + storage
- Vercel-ready deployment

## Tech Stack

- Next.js 14 App Router (TypeScript)
- Tailwind CSS + shadcn/ui
- Supabase (Postgres + Storage)
- Upstash Redis rate limiting (optional but recommended)

## Local Setup

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

The app runs on http://localhost:3000.

## Environment Variables

Create a .env.local file with:

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=order-images

ADMIN_PASSWORD=
ADMIN_AUTH_SECRET=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

MOCK_DB=false
```

Notes:
- ADMIN_PASSWORD and ADMIN_AUTH_SECRET secure the admin panel.
- UPSTASH_* values are optional; if omitted, rate limiting is disabled.
- Set MOCK_DB=true to enable the in-memory dummy database for testing.

### Admin Environment Security

- Keep `ADMIN_PASSWORD` and `ADMIN_AUTH_SECRET` in a secure vault (password manager, secrets store, or Vercel env vars). Do not commit them to git.
- Choose long, random values (32+ characters) and rotate them whenever a team member leaves or you suspect a leak.
- The middleware compares the supplied admin password against the hash derived from `ADMIN_AUTH_SECRET`, so every device that hits `/admin/login` must use the same values.

## Database Schema

Run the following in Supabase SQL editor:

```sql
create table if not exists orders (
	id uuid primary key default gen_random_uuid(),
	order_id text unique not null,
	ign text,
	customer_name text,
	uid text,
	game_type text,
	service_type text,
	start_date timestamptz,
	due_date timestamptz,
	status text check (status in ('pending', 'in_progress', 'done')) default 'pending',
	profile_screenshot_url text,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

create table if not exists sessions (
	id uuid primary key default gen_random_uuid(),
	order_id uuid references orders(id) on delete cascade,
	session_date timestamptz not null,
	summary text,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

create table if not exists session_images (
	id uuid primary key default gen_random_uuid(),
	session_id uuid references sessions(id) on delete cascade,
	image_url text not null,
	order_index int default 0
);

create index if not exists idx_sessions_order_id on sessions(order_id);
create index if not exists idx_session_images_session_id on session_images(session_id);
```

Storage setup:
- Create a public bucket named order-images (or match SUPABASE_STORAGE_BUCKET).

## Admin Panel

- Access via /admin (protected by middleware).
- Login at /admin/login.
- Create and update orders, add sessions with screenshots.

## Vercel Deployment

1. Push the repository to GitHub.
2. Create a new Vercel project.
3. Add the environment variables from above.
4. Ensure Supabase Storage bucket is set to public or uses signed URLs.

### Vercel Admin Secrets

- In your Vercel dashboard go to Project → Settings → Environment Variables.
- Add `ADMIN_PASSWORD` and `ADMIN_AUTH_SECRET` (strong values) to all scopes where the admin site will run (Production, Preview, Development).
- Keep the `Environment` set to the desired target (Production for live admin, Preview/Development if you want to log in during staging).
- After adding or rotating these values, trigger a redeploy so the middleware picks up the new secrets.

## Admin Subdomain Setup (Optional)

To move admin to a subdomain:

1. Create a new domain or subdomain in Vercel (e.g., admin.yourdomain.com).
2. Add a rewrite in vercel.json to route / to /admin.
3. Keep middleware protection enabled.

Example vercel.json:

```json
{
	"rewrites": [{ "source": "/(.*)", "destination": "/admin" }]
}
```

## API Routes

- POST /api/orders/check
- GET /api/orders/[id]
- POST /api/admin/orders/create
- PUT /api/admin/orders/[id]
- POST /api/admin/sessions/create
- POST /api/admin/upload

## Notes

- Replace placeholder images with real game screenshots.
- Ensure ADMIN_PASSWORD is strong and unique.
