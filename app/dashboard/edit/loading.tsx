export default function EditProfileLoading() {
  return (
    <div className="w-full min-w-0 space-y-4 animate-pulse">
      <div className="space-y-2 px-5 sm:px-6">
        <div className="h-5 w-32 rounded bg-surface-alt" />
        <div className="h-7 w-40 rounded bg-surface-alt" />
        <div className="h-4 w-56 rounded bg-surface-alt" />
      </div>
      <div className="card space-y-4 p-5 sm:p-6">
        <div className="h-6 w-36 rounded bg-surface-alt" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-16 rounded-md bg-surface-alt" />
          <div className="h-16 rounded-md bg-surface-alt" />
        </div>
        <div className="h-16 rounded-md bg-surface-alt" />
        <div className="h-24 w-24 rounded-lg bg-surface-alt" />
        <div className="h-16 rounded-md bg-surface-alt" />
        <div className="space-y-3 rounded-lg bg-surface-alt/40 p-4">
          <div className="h-5 w-36 rounded bg-surface-alt" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-16 rounded-md bg-surface-alt" />
            <div className="h-16 rounded-md bg-surface-alt" />
          </div>
        </div>
        <div className="h-24 rounded-md bg-surface-alt" />
        <div className="h-11 w-28 rounded-md bg-surface-alt" />
      </div>
    </div>
  );
}
