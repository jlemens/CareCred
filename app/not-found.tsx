import Link from "next/link";

export default function NotFound() {
  return (
    <section className="card w-full p-8">
      <h1 className="text-2xl font-semibold">Profile not found</h1>
      <p className="mt-2 text-sm text-muted">
        This CareCred page is unavailable or not published yet.
      </p>
      <Link
        href="/search"
        className="mt-5 inline-flex rounded-md border border-border px-4 py-2 text-sm transition hover:bg-surface-alt"
      >
        Search providers
      </Link>
    </section>
  );
}
