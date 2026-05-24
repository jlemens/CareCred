import { NotificationsPanel } from "@/components/notifications-panel";
import { getSessionUser } from "@/lib/queries";
import Link from "next/link";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <section className="card w-full p-8">
        <h1 className="text-2xl font-semibold">Sign in required</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to see notifications about your testimonials and profile activity.
        </p>
        <Link
          href="/auth"
          className="mt-5 inline-flex rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          Sign in
        </Link>
      </section>
    );
  }

  return <NotificationsPanel />;
}
