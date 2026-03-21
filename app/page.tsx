import Link from "next/link";

export default function Home() {
  return (
    <div className="flex w-full flex-col gap-8 py-2 sm:gap-14 sm:py-4">
      <section className="card grid gap-6 p-5 sm:gap-8 sm:p-8 lg:grid-cols-[1.3fr_1fr] lg:p-10">
        <div className="space-y-5">
          <p className="inline-block rounded-full border border-border px-3 py-1 text-xs uppercase tracking-wide text-muted">
            CareCred - Clinical Premium
          </p>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            Build trust with every patient story.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted">
            CareCred helps providers create a professional public page with
            PT-focused reviews, Google review imports with disclaimer
            attestation, and a shareable link for Instagram or QR cards.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/auth"
              className="rounded-md bg-accent-primary px-4 py-2 font-medium text-white transition hover:bg-accent-hover"
            >
              Create Account
            </Link>
            <Link
              href="/search"
              className="rounded-md border border-border px-4 py-2 font-medium text-foreground transition hover:bg-surface-alt"
            >
              Find a Provider
            </Link>
          </div>
        </div>
        <div className="card space-y-4 p-6">
          <h2 className="text-lg font-semibold">What is included in this MVP</h2>
          <ul className="space-y-2 text-sm text-muted">
            <li>- Supabase email auth and one profile per account</li>
            <li>- Provider and patient profile formats</li>
            <li>- Provider search by name and practice</li>
            <li>- PT survey review flow + guest submissions</li>
            <li>- Provider manual Google review imports with disclaimers</li>
          </ul>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Provider pages",
            body: "Show who you are, your specialty, experience, and patient feedback.",
          },
          {
            title: "Quick reviews",
            body: "Visitors tap New Review and finish the PT survey in under a minute.",
          },
          {
            title: "Share with QR",
            body: "Every provider gets a unique URL for Instagram bios and clinic QR cards.",
          },
        ].map((item) => (
          <article key={item.title} className="card p-5">
            <h3 className="text-base font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
          </article>
        ))}
      </section>

      <section className="card flex flex-col items-start justify-between gap-4 p-5 sm:p-6 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-semibold">Ready to launch your page?</h2>
          <p className="mt-2 text-sm text-muted">
            Sign up once to create your profile. After that, use{" "}
            <strong className="text-foreground">My page</strong> in the menu to
            open your public link and collect testimonials.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/auth"
            className="rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
          >
            Get started
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium transition hover:bg-surface-alt"
          >
            Account
          </Link>
        </div>
      </section>
    </div>
  );
}
