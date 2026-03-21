import { AuthPanel } from "@/components/auth-panel";
import { hasSupabaseEnv } from "@/lib/env";

export default function AuthPage() {
  return (
    <div className="mx-auto grid w-full max-w-lg gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          CareCred
        </h1>
        <p className="mt-2 text-sm text-muted">
          Sign in or create an account to continue.
        </p>
      </div>

      {!hasSupabaseEnv() ? (
        <div className="rounded-md border border-danger/60 bg-danger/10 p-4 text-center text-sm">
          Add Supabase environment variables to use sign-in. See{" "}
          <code className="rounded bg-background/60 px-1">.env.example</code>.
        </div>
      ) : null}

      <AuthPanel />
    </div>
  );
}
