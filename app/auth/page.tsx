import { AuthPanel } from "@/components/auth-panel";
import { hasSupabaseEnv } from "@/lib/env";

type Props = {
  searchParams: Promise<{ signup?: string }>;
};

export default async function AuthPage({ searchParams }: Props) {
  const { signup } = await searchParams;
  const initialMode =
    signup === "1" || signup === "true" ? "signup" : "signin";

  return (
    <div className="mx-auto grid w-full max-w-lg gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          CareCred
        </h1>
        <p className="mt-4 bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-base font-semibold leading-snug text-transparent sm:text-lg">
          Patient–provider testimonials, made easy.
        </p>
        <p className="mt-3 text-sm text-muted">
          Join for free to set up your profile and collect testimonials — or
          sign in if you already have an account.
        </p>
      </div>

      {!hasSupabaseEnv() ? (
        <div className="rounded-md border border-danger/60 bg-danger/10 p-4 text-center text-sm">
          Add Supabase environment variables to use sign-in. See{" "}
          <code className="rounded bg-background/60 px-1">.env.example</code>.
        </div>
      ) : null}

      <AuthPanel initialMode={initialMode} />
    </div>
  );
}
