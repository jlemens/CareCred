import Link from "next/link";
import { ProfileEditor } from "@/components/profile-editor";
import { getProfileByUserId, getSessionUser } from "@/lib/queries";
import { hasSupabaseEnv } from "@/lib/env";

export default async function DashboardEditProfilePage() {
  if (!hasSupabaseEnv()) {
    return (
      <section className="card w-full p-8">
        <h1 className="text-2xl font-semibold">Unavailable</h1>
        <p className="mt-2 text-sm text-muted">Configure Supabase in `.env.local`.</p>
      </section>
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return (
      <section className="card w-full p-8">
        <h1 className="text-2xl font-semibold">Sign in required</h1>
        <Link
          href="/auth"
          className="mt-4 inline-flex rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white"
        >
          Sign in
        </Link>
      </section>
    );
  }

  const profile = await getProfileByUserId(user.id);

  if (!profile) {
    return (
      <section className="card w-full p-8">
        <h1 className="text-2xl font-semibold">Create your profile first</h1>
        <p className="mt-2 text-sm text-muted">
          Finish onboarding on your account page, then you can edit your profile
          here.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white"
        >
          Go to account
        </Link>
      </section>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-4">
      {/*
        Match ProfileEditor card inner padding (p-5 sm:p-6) so back link + title
        line up with form fields on iOS (avoids “header vs box” misalignment).
      */}
      <div className="space-y-1 px-5 sm:px-6">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center text-sm text-muted transition hover:text-foreground"
        >
          ← Back to account
        </Link>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Edit profile
        </h1>
        <p className="text-sm text-muted">
          Name, credentials, and details shown on your public page.
        </p>
      </div>
      <ProfileEditor
        key={profile.id}
        userId={user.id}
        initial={{
          ...profile,
          email: user.email ?? "",
        }}
      />
    </div>
  );
}
