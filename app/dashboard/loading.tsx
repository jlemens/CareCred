export default function DashboardLoading() {
  return (
    <div className="grid w-full gap-6 animate-pulse">
      <section className="card p-6">
        <div className="h-7 w-32 rounded bg-surface-alt" />
        <div className="mt-2 h-4 w-64 rounded bg-surface-alt" />
      </section>
      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-6 w-44 rounded bg-surface-alt" />
            <div className="h-4 w-28 rounded bg-surface-alt" />
          </div>
          <div className="flex gap-2">
            <div className="h-11 w-28 rounded-md bg-surface-alt" />
            <div className="h-11 w-24 rounded-md bg-surface-alt" />
          </div>
        </div>
      </section>
      <section className="card p-6">
        <div className="h-6 w-44 rounded bg-surface-alt" />
        <div className="mt-4 space-y-3">
          <div className="h-16 rounded-md bg-surface-alt" />
          <div className="h-16 rounded-md bg-surface-alt" />
        </div>
      </section>
    </div>
  );
}
