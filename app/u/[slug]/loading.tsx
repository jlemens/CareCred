export default function ProfileLoading() {
  return (
    <div className="grid w-full gap-6 animate-pulse">
      <section className="card p-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="h-24 w-24 shrink-0 rounded-xl bg-surface-alt" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-48 rounded bg-surface-alt" />
            <div className="h-4 w-28 rounded bg-surface-alt" />
            <div className="h-4 w-40 rounded bg-surface-alt" />
          </div>
        </div>
        <div className="mt-4 h-11 w-full rounded-md bg-surface-alt" />
        <div className="mt-4 space-y-2">
          <div className="h-4 w-full rounded bg-surface-alt" />
          <div className="h-4 w-3/4 rounded bg-surface-alt" />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="h-16 rounded-md bg-surface-alt" />
          <div className="h-16 rounded-md bg-surface-alt" />
          <div className="h-16 rounded-md bg-surface-alt" />
        </div>
      </section>
      <section className="card p-6">
        <div className="h-6 w-36 rounded bg-surface-alt" />
        <div className="mt-4 space-y-3">
          <div className="h-24 rounded-md bg-surface-alt" />
          <div className="h-24 rounded-md bg-surface-alt" />
        </div>
      </section>
    </div>
  );
}
