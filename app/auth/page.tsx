import { AuthPanel } from "@/components/auth-panel";
import { hasSupabaseEnv } from "@/lib/env";

export default function AuthPage() {
  return (
    <div className="grid w-full gap-6 lg:grid-cols-[1fr_420px]">
      <section className="card p-6 sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight">Join CareCred</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
          Create one account per email and choose a profile format: Provider or
          Patient. Providers can publish a professional page with PT-focused
          review collection and QR-friendly sharing.
        </p>
        <ul className="mt-6 space-y-2 text-sm text-muted">
          <li>- Provider profiles require a profile picture before search listing.</li>
          <li>- Patient profiles support a &quot;My given testimonials&quot; view.</li>
          <li>- PT survey is active for MVP; other survey templates are coming soon.</li>
        </ul>

        {!hasSupabaseEnv() ? (
          <div className="mt-6 rounded-md border border-danger/60 bg-danger/10 p-4 text-sm">
            Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
            in `.env.local` before using auth and database features.
          </div>
        ) : null}
      </section>
      <AuthPanel />
    </div>
  );
}
