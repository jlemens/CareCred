import Link from "next/link";

export default function Home() {
  return (
    <div className="flex w-full flex-col gap-10 py-4 sm:gap-14 sm:py-6">
      <section className="card p-6 sm:p-10">
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
          Build trust with every patient story.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted sm:text-base">
          CareCred gives providers a professional public page, shareable link,
          and a simple way to collect testimonials.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/auth"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover"
          >
            Sign in
          </Link>
          <Link
            href="/auth"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-surface-alt"
          >
            Create account
          </Link>
          <Link
            href="/search"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-surface-alt"
          >
            Find a provider
          </Link>
        </div>
      </section>
    </div>
  );
}
