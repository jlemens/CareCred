import Link from "next/link";
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
          Search by name, practice, location, specialties, education, or the
          credentials line on a provider profile (not case-sensitive).
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
              <div>
                <h2 className="text-lg font-semibold">{provider.display_name}</h2>
                <p className="text-sm text-muted">
                  {provider.practice_name ?? "Independent practice"}{" "}
                  {provider.location ? `- ${provider.location}` : ""}
                </p>
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
