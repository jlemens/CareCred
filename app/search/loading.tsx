export default function SearchLoading() {
  return (
    <div className="grid w-full gap-6 animate-pulse">
      <section className="card p-5 sm:p-6">
        <div className="h-7 w-44 rounded bg-surface-alt" />
        <div className="mt-2 h-4 w-72 rounded bg-surface-alt" />
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="h-10 w-full flex-1 rounded-md bg-surface-alt" />
          <div className="h-10 w-full rounded-md bg-surface-alt sm:w-20" />
        </div>
      </section>
      <section className="grid gap-3">
        <div className="card h-20 p-5" />
        <div className="card h-20 p-5" />
        <div className="card h-20 p-5" />
      </section>
    </div>
  );
}
