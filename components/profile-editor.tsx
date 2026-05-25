"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile, ProfileType } from "@/lib/types";
import { AccountPasswordCollapsible } from "@/components/account-password-collapsible";
import { AvatarCropModal } from "@/components/avatar-crop-modal";
import { prepareAvatarForUpload } from "@/lib/image-compress";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { namesFromProfile } from "@/lib/profile-names";
import { reviewerStateSelectOptions } from "@/lib/us-states";

function RequiredMark() {
  return <span className="font-medium text-danger"> (required)</span>;
}

/** Max size of the original file picked from the device (before compression). */
const AVATAR_RAW_MAX_BYTES = 35 * 1024 * 1024;
/** GIFs are not recompressed; must fit under storage bucket limit. */
const AVATAR_GIF_MAX_BYTES = 15 * 1024 * 1024;
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type Props = {
  userId: string;
  initial: Partial<Profile> & { email?: string };
  /** When true (first-time onboarding), profile type cannot be changed here. */
  lockProfileType?: boolean;
  /** First profile creation — show slug “one change” policy. */
  isFirstTimeProfile?: boolean;
};

export function ProfileEditor({
  userId,
  initial,
  lockProfileType = false,
  isFirstTimeProfile = false,
}: Props) {
  const router = useRouter();
  const { first: initialFirst, last: initialLast } = namesFromProfile(initial);

  const [profileType, setProfileType] = useState<ProfileType>(
    (initial.profile_type as ProfileType) ?? "provider",
  );
  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [slug, setSlug] = useState(initial.slug ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url ?? "");
  const [practiceName, setPracticeName] = useState(initial.practice_name ?? "");
  const [credentials, setCredentials] = useState(initial.credentials ?? "");
  const [profession, setProfession] = useState(initial.profession ?? "");
  const [specialties, setSpecialties] = useState(initial.specialties ?? "");
  const [education, setEducation] = useState(initial.education ?? "");
  const [yearsExperience, setYearsExperience] = useState(
    initial.years_experience?.toString() ?? "",
  );
  const [location, setLocation] = useState(initial.location ?? "");
  const [homeState, setHomeState] = useState(initial.home_state ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [avatarCropSrc, setAvatarCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    return () => {
      if (avatarCropSrc) URL.revokeObjectURL(avatarCropSrc);
    };
  }, [avatarCropSrc]);

  const slugLocked = Boolean(initial.id);

  const displayPreview = useMemo(() => {
    const combined = `${firstName} ${lastName}`.replace(/\s+/g, " ").trim();
    return combined || "—";
  }, [firstName, lastName]);

  /** Returns true when the public avatar URL was updated. */
  async function handleAvatarFile(file: File): Promise<boolean> {
    setUploadError(null);
    if (!supabase) {
      setUploadError("Supabase is not configured.");
      return false;
    }
    if (!AVATAR_TYPES.includes(file.type)) {
      setUploadError("Use JPG, PNG, WebP, or GIF.");
      return false;
    }
    if (file.size > AVATAR_RAW_MAX_BYTES) {
      setUploadError(
        "This file is too large to open in the browser. Try a photo under 35 MB or pick a different image.",
      );
      return false;
    }

    setUploadingAvatar(true);
    try {
      let uploadBlob: Blob;
      let ext: string;
      let contentType: string;

      if (file.type === "image/gif") {
        if (file.size > AVATAR_GIF_MAX_BYTES) {
          setUploadError(
            "GIF must be 15 MB or smaller, or use JPG/PNG (large photos are compressed automatically).",
          );
          return false;
        }
        uploadBlob = file;
        ext = "gif";
        contentType = "image/gif";
      } else {
        const prepared = await prepareAvatarForUpload(file);
        uploadBlob = prepared.blob;
        ext = prepared.pathSuffix;
        contentType = "image/jpeg";
      }

      const path = `${userId}/avatar.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, uploadBlob, {
          cacheControl: "3600",
          upsert: true,
          contentType,
        });

      if (error) {
        const msg = error.message.toLowerCase();
        if (
          msg.includes("bucket not found") ||
          msg.includes("the resource was not found")
        ) {
          setUploadError(
            'Storage bucket "avatars" is missing. In Supabase: SQL Editor → paste and run carecred/supabase/storage.sql. Or Storage → New bucket → name: avatars → Public bucket.',
          );
        } else {
          setUploadError(error.message);
        }
        return false;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      const bustCache = `${publicUrl}?t=${Date.now()}`;
      setAvatarUrl(bustCache);
      return true;
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Could not process this image.",
      );
      return false;
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function clearAvatarCrop() {
    if (avatarCropSrc) {
      URL.revokeObjectURL(avatarCropSrc);
      setAvatarCropSrc(null);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    if (profileType === "provider") {
      if (!avatarUrl.trim()) {
        setMessage(
          "Add a profile photo (upload a file or paste an image URL) to save.",
        );
        setLoading(false);
        return;
      }
      if (!bio.trim()) {
        setMessage("About you is required for provider accounts.");
        setLoading(false);
        return;
      }
      if (!profession.trim()) {
        setMessage("Profession is required for provider accounts.");
        setLoading(false);
        return;
      }
    }
    if (profileType === "patient" && !homeState) {
      setMessage("Select your state.");
      setLoading(false);
      return;
    }

    const payload = {
      profileType,
      firstName,
      lastName,
      slug,
      avatarUrl,
      profession: profileType === "provider" ? profession : "",
      practiceName,
      specialties,
      education,
      credentials: profileType === "provider" ? credentials : "",
      yearsExperience,
      location,
      bio,
      homeState: profileType === "patient" ? homeState : undefined,
    };

    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = (await response.json()) as { error?: string; ok?: boolean };
    if (!response.ok) {
      setMessage(json.error ?? "Unable to save profile");
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/dashboard");
  }

  return (
    <>
      {avatarCropSrc ? (
        <AvatarCropModal
          imageSrc={avatarCropSrc}
          onCancel={clearAvatarCrop}
          onApply={async (croppedFile) => {
            const ok = await handleAvatarFile(croppedFile);
            if (ok) clearAvatarCrop();
          }}
        />
      ) : null}
    <form
      onSubmit={onSubmit}
      className="card w-full min-w-0 space-y-4 p-5 sm:p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <h2 className="text-lg font-semibold">Profile settings</h2>
        {initial.email ? (
          <p className="shrink-0 text-xs text-muted sm:max-w-[min(100%,20rem)] sm:text-right">
            Account email: {initial.email}
          </p>
        ) : null}
      </div>

      {initial.email ? (
        <AccountPasswordCollapsible accountEmail={initial.email} />
      ) : null}

      {lockProfileType ? (
        <p className="rounded-md border border-border bg-surface-alt px-3 py-2 text-sm">
          Account type:{" "}
          <strong className="text-foreground">
            {profileType === "provider" ? "Provider" : "Patient"}
          </strong>
        </p>
      ) : (
        <label className="block space-y-2">
          <span className="text-sm text-muted">Profile type</span>
          <select
            value={profileType}
            onChange={(e) => setProfileType(e.target.value as ProfileType)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="provider">Provider</option>
            <option value="patient">Patient</option>
          </select>
        </label>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm text-muted">
            First name
            <RequiredMark />
          </span>
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-muted">
            Last name
            {profileType === "provider" ? <RequiredMark /> : null}
            {profileType === "patient" ? (
              <span className="font-normal text-muted"> (optional)</span>
            ) : null}
          </span>
          <input
            required={profileType === "provider"}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
      </div>

      <p className="text-xs text-muted">
        Public display name (used on your page and in search):{" "}
        <span className="font-medium text-foreground">{displayPreview}</span>
      </p>

      {profileType === "patient" ? (
        <label className="block space-y-2">
          <span className="text-sm text-muted">
            State you live in
            <RequiredMark />
          </span>
          <span className="block text-xs text-muted">
            Same options as when you leave a standard review.
          </span>
          <select
            required
            value={homeState}
            onChange={(e) => setHomeState(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select state</option>
            {reviewerStateSelectOptions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm text-muted">
          Public slug
          <RequiredMark />
        </span>
        <span className="block text-xs text-muted">
          (what your public link will be)
        </span>
        {isFirstTimeProfile ? (
          <p className="text-xs text-muted">
            This becomes your permanent public URL (
            <span className="font-mono text-foreground/90">/u/your-slug</span>).
            You won&apos;t be able to change it after you save your profile.
          </p>
        ) : null}
        {slugLocked ? (
          <p className="text-xs text-muted">
            Public link:{" "}
            <span className="font-mono text-foreground">/u/{slug}</span> (can&apos;t
            be changed).
          </p>
        ) : null}
        <input
          required
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          placeholder="jane-doe-pt"
          disabled={slugLocked}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>

      <div className="space-y-3">
        <span className="text-sm text-muted">
          Profile photo
          {profileType === "provider" ? <RequiredMark /> : null}
          {profileType === "patient" ? (
            <span className="font-normal text-muted"> (optional)</span>
          ) : null}
        </span>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-alt">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="px-2 text-center text-xs text-muted">No photo</span>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={uploadingAvatar || !supabase || Boolean(avatarCropSrc)}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.type === "image/gif") {
                  void handleAvatarFile(f);
                  return;
                }
                clearAvatarCrop();
                setAvatarCropSrc(URL.createObjectURL(f));
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-accent-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-accent-hover"
            />
            {uploadingAvatar ? (
              <p className="text-xs text-muted">Uploading...</p>
            ) : null}
            {uploadError ? (
              <p className="text-xs text-danger">{uploadError}</p>
            ) : null}
            {!supabase ? (
              <p className="text-xs text-muted">
                Add Supabase env vars to enable upload.
              </p>
            ) : (
              <p className="text-xs text-muted">
                JPG, PNG, and WebP: crop and position in the editor, then we
                compress for upload. GIFs stay animated (up to 15 MB) and skip
                cropping.
              </p>
            )}
          </div>
        </div>
        <label className="block space-y-2">
          <span className="text-sm text-muted">
            Or paste image URL
            {profileType === "provider" ? (
              <span className="font-normal text-muted">
                {" "}
                (optional if you uploaded a file)
              </span>
            ) : (
              <span className="font-normal text-muted"> (optional)</span>
            )}
          </span>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
      </div>

      {profileType === "provider" ? (
        <>
          <label className="block space-y-2">
            <span className="text-sm text-muted">
              Profession
              <RequiredMark />
            </span>
            <input
              required
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder="e.g. Physical Therapist, Occupational Therapist"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <span className="text-xs text-muted">
              Shown on your public profile and in search results next to your
              name.
            </span>
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-muted">Credentials (optional)</span>
            <input
              value={credentials}
              onChange={(e) => setCredentials(e.target.value)}
              placeholder="e.g. DPT, OCS, FAAOMPT"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <span className="text-xs text-muted">
              Shown on your public profile and included in provider search.
            </span>
          </label>

          <div className="space-y-3 rounded-lg border border-border/60 bg-surface-alt/40 p-4">
            <p className="text-sm font-medium text-foreground">
              Professional details{" "}
              <span className="font-normal text-muted">(optional)</span>
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm text-muted">Practice name</span>
                <input
                  value={practiceName}
                  onChange={(e) => setPracticeName(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm text-muted">Location</span>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
            </div>
            <label className="block space-y-2">
              <span className="text-sm text-muted">Specialties</span>
              <input
                value={specialties}
                onChange={(e) => setSpecialties(e.target.value)}
                placeholder="e.g. Sports rehab, post-op recovery"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm text-muted">Education</span>
                <input
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="e.g. University, program, year"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm text-muted">Years of experience</span>
                <input
                  type="number"
                  min={0}
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
            </div>
          </div>
        </>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm text-muted">
          About you
          {profileType === "provider" ? <RequiredMark /> : null}
          {profileType === "patient" ? (
            <span className="font-normal text-muted"> (optional)</span>
          ) : null}
        </span>
        <textarea
          rows={4}
          required={profileType === "provider"}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading || uploadingAvatar}
          className="rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-60"
        >
          {uploadingAvatar
            ? "Uploading photo..."
            : loading
              ? "Saving..."
              : "Save profile"}
        </button>
      </div>

      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </form>
    </>
  );
}
