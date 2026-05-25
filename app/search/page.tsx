import Link from "next/link";
import { ProfilePhoto } from "@/components/profile-photo";
import { searchProviders } from "@/lib/queries";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const results = await searchProviders(q);

  return (
    <div className="grid w-full gap-6">
      <section className="card p-5 sm:p-6">
        <h1 className="text-2xl font-semibold">Find a provider</h1>
        <p className="mt-2 text-sm text-muted">
          Search by name, profession, practice, location, specialties, education,
          or credentials (not case-sensitive).
        </p>
        <form className="mt-4 flex flex-col gap-2 sm:flex-row" action="/search">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search provider or practice..."
            className="min-w-0 w-full flex-1 rounded-md border border-border bg-background px-3 py-2"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover sm:w-auto"
          >
            Search
          </button>
        </form>
      </section>

      <section className="grid gap-3">
        {!q ? (
          <p className="text-sm text-muted">
            Showing up to 20 providers. Use search to narrow results.
          </p>
        ) : null}
        {q && results.length === 0 ? (
          <p className="text-sm text-muted">
            No provider profiles matched that text. Try fewer words or a credential
            like DPT or OCS.
          </p>
        ) : null}
        {results.map((provider) => (
          <article key={provider.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                {provider.avatar_url ? (
                  <ProfilePhoto src={provider.avatar_url} variant="thumbnail" />
                ) : (
                  <div
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-alt text-lg font-semibold text-muted"
                    aria-hidden
                  >
                    {provider.display_name.trim().charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold leading-snug">
                    {provider.display_name}
                  </h2>
                  <p
                    className={
                      provider.profession?.trim()
                        ? "mt-0.5 text-sm font-medium text-accent-secondary"
                        : "mt-0.5 text-sm text-muted"
                    }
                  >
                    {provider.profession?.trim() || "Profession not listed"}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {provider.practice_name ?? "Independent practice"}
                    {provider.location ? ` · ${provider.location}` : ""}
                  </p>
                </div>
              </div>
              <Link
                href={`/u/${provider.slug}`}
                className="rounded-md border border-border px-3 py-2 text-sm transition hover:bg-surface-alt"
              >
                Open page
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
