"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile, ProfileType } from "@/lib/types";
import { prepareAvatarForUpload } from "@/lib/image-compress";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { namesFromProfile } from "@/lib/profile-names";

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
};

export function ProfileEditor({ userId, initial, lockProfileType = false }: Props) {
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
  const [specialties, setSpecialties] = useState(initial.specialties ?? "");
  const [education, setEducation] = useState(initial.education ?? "");
  const [yearsExperience, setYearsExperience] = useState(
    initial.years_experience?.toString() ?? "",
  );
  const [location, setLocation] = useState(initial.location ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const displayPreview = useMemo(() => {
    const combined = `${firstName} ${lastName}`.replace(/\s+/g, " ").trim();
    return combined || "—";
  }, [firstName, lastName]);

  const profileLink = useMemo(
    () =>
      typeof window !== "undefined" && slug
        ? `${window.location.origin}/u/${slug}`
        : "",
    [slug],
  );

  async function handleAvatarFile(file: File) {
    setUploadError(null);
    if (!supabase) {
      setUploadError("Supabase is not configured.");
      return;
    }
    if (!AVATAR_TYPES.includes(file.type)) {
      setUploadError("Use JPG, PNG, WebP, or GIF.");
      return;
    }
    if (file.size > AVATAR_RAW_MAX_BYTES) {
      setUploadError(
        "This file is too large to open in the browser. Try a photo under 35 MB or pick a different image.",
      );
      return;
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
          setUploadingAvatar(false);
          return;
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
        setUploadingAvatar(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(publicUrl);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Could not process this image.",
      );
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const payload = {
      profileType,
      firstName,
      lastName,
      slug,
      avatarUrl,
      practiceName,
      specialties,
      education,
      credentials: profileType === "provider" ? credentials : "",
      yearsExperience,
      location,
      bio,
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

    setMessage("Profile saved.");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Profile settings</h2>
        {initial.email ? (
          <p className="text-xs text-muted">Account email: {initial.email}</p>
        ) : null}
      </div>

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
          <span className="text-sm text-muted">First name</span>
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-muted">Last name</span>
          <input
            required
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

      <label className="block space-y-2">
        <span className="text-sm text-muted">Public slug</span>
        <input
          required
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          placeholder="jane-doe-pt"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </label>

      {profileType === "provider" ? (
        <>
          <div className="space-y-3">
            <span className="text-sm text-muted">
              Profile photo (required for providers)
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
                  <span className="px-2 text-center text-xs text-muted">
                    No photo
                  </span>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={uploadingAvatar || !supabase}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleAvatarFile(f);
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
                    JPG, PNG, and WebP are compressed before upload. GIFs stay
                    animated (up to 15 MB).
                  </p>
                )}
              </div>
            </div>
            <label className="block space-y-2">
              <span className="text-sm text-muted">
                Or paste image URL (optional)
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
      ) : (
        <p className="rounded-md border border-border bg-surface-alt p-3 text-sm text-muted">
          Patient accounts do not require a profile photo.
        </p>
      )}

      <label className="block space-y-2">
        <span className="text-sm text-muted">About you</span>
        <textarea
          rows={4}
          required
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save profile"}
        </button>
        {profileLink ? (
          <a
            href={profileLink}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-accent-secondary hover:underline"
          >
            Open public link
          </a>
        ) : null}
      </div>

      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </form>
  );
}
