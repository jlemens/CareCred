## CareCred MVP

CareCred is a dark-theme testimonial and personal brand platform focused on physical therapy providers.

This starter includes:

- Supabase email authentication.
- One profile per account email.
- Provider and patient profile formats (switchable).
- Provider search by display name and practice name.
- Public provider pages at `/u/[slug]`.
- PT-specific quick survey with guest submissions.
- Provider-imported Google review entries with required disclaimer attestation.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create environment file from example:

   ```bash
   cp .env.example .env.local
   ```

   Fill:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. In Supabase SQL editor, run:

   - `supabase/schema.sql`
   - `supabase/storage.sql` (creates the `avatars` bucket, 15 MB limit, and upload policies). Re-run it if you already created the bucket with an older 5 MB limit.

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel (test on iOS)

See **[docs/VERCEL.md](docs/VERCEL.md)** for step-by-step: Git import, **Root Directory** (`carecred` if nested), `NEXT_PUBLIC_SUPABASE_*` env vars, and Supabase **Auth URL** settings for your production domain.

Quick checklist:

1. Push this app to GitHub (repo root = `carecred`, or set Vercel **Root Directory** to `carecred`).
2. Vercel → New Project → import repo → add the two Supabase env vars → Deploy.
3. Supabase → Authentication → URL configuration → add your `https://….vercel.app` URL to **Site URL** and **Redirect URLs**.

After that, open your Vercel URL on your iPhone. Local development stays `npm run dev`; pushes to Git update production (or use Preview branches).

## Important behavior

- Providers appear in search only when `is_complete = true`.
- For provider profile completeness (`is_complete` / search): profile photo + About/bio. Practice name, location, specialties, education, and years of experience are optional.
- Guest PT survey reviews are allowed (higher spam risk; add CAPTCHA/rate limits for production hardening).
- Imported Google reviews require provider attestation in the dashboard form.
