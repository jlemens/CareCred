# Deploy CareCred to Vercel (iOS / production preview)

## 1. Put the app on Git (if it is not already)

From the folder that contains **`carecred`** (or from inside `carecred` if that is your repo root):

```bash
git init
git add .
git commit -m "CareCred MVP"
```

Create a repository on GitHub and push:

```bash
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git branch -M main
git push -u origin main
```

**Important:** If your Git repo is the parent folder (`DPTforME testomonial app`) and `carecred` is a subfolder, use **Root Directory = `carecred`** in Vercel (step 2). If the repo is only the `carecred` folder, leave Root Directory empty (`.`).

## 2. Create a Vercel project

### Option A — Dashboard (recommended)

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. **Import** your Git repository.
3. **Root Directory:** set to `carecred` if the app lives in that subfolder; otherwise leave default.
4. Framework: **Next.js** (auto-detected).
5. **Environment variables** (Production + Preview):

   | Name | Value |
   |------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon (public) key |

6. Click **Deploy**.

### Option B — Vercel CLI

```bash
cd path/to/carecred
npm i -g vercel
vercel login
vercel
```

Link the project, then add env vars in the Vercel dashboard (**Settings → Environment Variables**) or via `vercel env pull` / CLI prompts.

## 3. Configure Supabase for your Vercel URL

After the first deploy, copy your production URL (e.g. `https://carecred-xxx.vercel.app`).

In **Supabase Dashboard** → **Authentication** → **URL configuration**:

1. **Site URL:** your Vercel URL (or your future custom domain).
2. **Redirect URLs:** add:
   - `https://YOUR-APP.vercel.app/**`
   - `https://YOUR-APP.vercel.app/` (default after sign-in / email links)
   - `https://YOUR-APP.vercel.app/dashboard` (settings / onboarding)
   - `http://localhost:3000/**` (optional, for local dev)

This matters for **email confirmation links** and OAuth if you add it later.

## 4. Smoke test on iPhone

1. Open the Vercel URL in **Safari** on iOS.
2. Sign up / sign in, create a profile, upload a photo, open **My page**.
3. Submit a test review from another device or a private window.

## 5. Keep developing locally

Local dev is unchanged:

```bash
cd carecred
npm run dev
```

Push to `main` (or your production branch) to trigger new Vercel deployments. Use **Preview deployments** for branches/PRs to test changes before merging.

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| Build fails | Root Directory must be the folder with `package.json` (`carecred`). |
| Auth works locally but not on Vercel | Supabase **Redirect URLs** and **Site URL** include your Vercel domain. |
| Storage / avatar errors | `storage.sql` was run on the same Supabase project; bucket `avatars` exists. |
| Env vars missing | Vercel → Project → Settings → Environment Variables; redeploy after changes. |
