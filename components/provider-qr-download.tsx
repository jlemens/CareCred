"use client";

import { useCallback, useState } from "react";
import QRCode from "qrcode";

type Props = {
  slug: string;
};

const QR_OPTIONS = {
  width: 512,
  margin: 2,
  errorCorrectionLevel: "M" as const,
  color: { dark: "#0a0d14ff", light: "#ffffffff" },
};

const OUTLINE_BUTTON =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 py-2 text-center text-sm font-medium transition hover:bg-surface-alt disabled:opacity-60";

async function buildProfileQr(slug: string) {
  const origin = window.location.origin;
  const profileUrl = `${origin}/u/${slug}`;
  const dataUrl = await QRCode.toDataURL(profileUrl, QR_OPTIONS);
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], `carecred-profile-${slug}-qr.png`, {
    type: "image/png",
  });
  return { profileUrl, dataUrl, file };
}

export function ProviderQrDownloadButton({ slug }: Props) {
  const [busy, setBusy] = useState<"download" | "share" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const download = useCallback(async () => {
    setError(null);
    setInfo(null);
    setBusy("download");
    try {
      const { dataUrl } = await buildProfileQr(slug);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `carecred-profile-${slug}-qr.png`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not create the QR code.",
      );
    } finally {
      setBusy(null);
    }
  }, [slug]);

  const saveToPhotos = useCallback(async () => {
    setError(null);
    setInfo(null);
    setBusy("share");
    try {
      const { file, profileUrl, dataUrl } = await buildProfileQr(slug);

      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: "Save QR code to Photos",
          text: profileUrl,
        });
        return;
      }

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `carecred-profile-${slug}-qr.png`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setInfo(
        "Sharing isn’t available in this browser — we downloaded the PNG instead. Open it from your Downloads or Files folder.",
      );
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        return;
      }
      setError(
        e instanceof Error ? e.message : "Could not share the QR code.",
      );
    } finally {
      setBusy(null);
    }
  }, [slug]);

  return (
    <div className="mt-2 flex w-full flex-col gap-2 border-t border-border pt-4 sm:mt-0 sm:w-auto sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
      <p className="text-xs text-muted">
        QR codes your exact public link (/u/{slug}) — unique to your profile.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => void saveToPhotos()}
          disabled={busy !== null}
          className={OUTLINE_BUTTON}
          title="Opens your device share sheet — on iPhone, choose Save Image to add to Photos."
        >
          {busy === "share" ? "Opening…" : "Save QR code to Photos"}
        </button>
        <button
          type="button"
          onClick={() => void download()}
          disabled={busy !== null}
          className={OUTLINE_BUTTON}
        >
          {busy === "download" ? "Creating…" : "Download QR code"}
        </button>
      </div>
      <p className="text-xs text-muted">
        On phones,{" "}
        <span className="font-medium text-foreground/90">
          Save QR code to Photos
        </span>{" "}
        opens the share menu; on iPhone pick <span className="italic">Save Image</span>.
      </p>
      {info ? (
        <p className="text-xs text-muted" role="status">
          {info}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
