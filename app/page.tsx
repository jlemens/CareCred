import { redirect } from "next/navigation";
import { HomeEntry } from "@/components/home-entry";
import { hasSupabaseEnv } from "@/lib/env";
import { getProfileByUserId, getSessionUser } from "@/lib/queries";

export default async function Home() {
  if (!hasSupabaseEnv()) {
    redirect("/auth");
  }

  const user = await getSessionUser();
  if (!user) {
    // Client gate preserves #recovery hash tokens; server redirect to /auth drops them.
    return <HomeEntry />;
  }

  const profile = await getProfileByUserId(user.id);
  if (!profile) {
    redirect("/dashboard");
  }

  redirect(`/u/${profile.slug}`);
}
