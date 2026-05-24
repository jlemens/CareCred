import Link from "next/link";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { hasSupabaseEnv } from "@/lib/env";

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto grid w-full max-w-lg gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          CareCred
        </h1>
        <p className="mt-2 text-sm text-muted">Set a new password</p>
      </div>

      {!hasSupabaseEnv() ? (
        <div className="rounded-md border border-danger/60 bg-danger/10 p-4 text-center text-sm">
          Add Supabase environment variables. See{" "}
          <code className="rounded bg-background/60 px-1">.env.example</code>.
        </div>
      ) : null}

      <div className="card p-6">
        <ResetPasswordForm />
      </div>

      <p className="text-center text-sm text-muted">
        <Link href="/auth" className="underline-offset-2 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
