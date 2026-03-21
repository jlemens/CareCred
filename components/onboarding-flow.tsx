"use client";

import { useState } from "react";
import type { ProfileType } from "@/lib/types";
import { LogoutButton } from "@/components/logout-button";
import { ProfileEditor } from "@/components/profile-editor";

type OnboardingState =
  | { step: "role" }
  | { step: "profile"; profileType: ProfileType };

type Props = {
  userId: string;
  email: string;
};

export function OnboardingFlow({ userId, email }: Props) {
  const [state, setState] = useState<OnboardingState>({ step: "role" });

  if (state.step === "role") {
    return (
      <div className="grid w-full gap-6">
        <section className="card p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to CareCred
          </h1>
          <p className="mt-2 text-sm text-muted">
            Choose how you&apos;ll use CareCred. You can finish your profile
            next.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() =>
              setState({ step: "profile", profileType: "provider" })
            }
            className="card flex min-h-32 flex-col items-start justify-center p-6 text-left transition hover:border-accent-primary/40 hover:bg-surface-alt"
          >
            <span className="text-lg font-semibold">I&apos;m a provider</span>
            <span className="mt-2 text-sm text-muted">
              Public profile, photo, testimonials, and a shareable link.
            </span>
          </button>
          <button
            type="button"
            onClick={() => setState({ step: "profile", profileType: "patient" })}
            className="card flex min-h-32 flex-col items-start justify-center p-6 text-left transition hover:border-accent-primary/40 hover:bg-surface-alt"
          >
            <span className="text-lg font-semibold">I&apos;m a patient</span>
            <span className="mt-2 text-sm text-muted">
              Leave testimonials for providers you&apos;ve seen.
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid w-full gap-6">
      <section className="card flex flex-wrap items-center justify-between gap-4 p-4 sm:p-6">
        <p className="text-sm text-muted">
          Signed in as {email || "your account"}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setState({ step: "role" })}
            className="text-sm text-muted underline-offset-2 transition hover:text-foreground hover:underline"
          >
            Change account type
          </button>
          <LogoutButton />
        </div>
      </section>
      <ProfileEditor
        key={state.profileType}
        userId={userId}
        initial={{
          email,
          profile_type: state.profileType,
        }}
        lockProfileType
      />
    </div>
  );
}
