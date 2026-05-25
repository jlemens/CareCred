type Props = {
  src: string;
  /** Public provider header — full width, no edge cropping. */
  variant?: "hero" | "thumbnail" | "preview";
  className?: string;
};

/**
 * Profile images use object-contain with inner padding so banner-style photos
 * (e.g. text at the bottom) are not clipped at the edges.
 */
export function ProfilePhoto({
  src,
  variant = "thumbnail",
  className = "",
}: Props) {
  if (variant === "hero") {
    return (
      <div
        className={`rounded-xl border border-border bg-surface-alt px-3 py-3 sm:px-4 sm:py-4 ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="mx-auto block max-h-[min(22rem,70vw)] w-full object-contain object-center"
        />
      </div>
    );
  }

  if (variant === "preview") {
    return (
      <div
        className={`flex min-h-24 w-full max-w-[14rem] items-center justify-center rounded-lg border border-border bg-surface-alt px-2 py-2 sm:max-w-xs ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="max-h-40 max-w-full object-contain object-center"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-alt p-1.5 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="max-h-full max-w-full object-contain object-center"
      />
    </div>
  );
}
