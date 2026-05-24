import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/env";
import { getProfileByUserId, getSessionUser } from "@/lib/queries";

export default async function Home() {
  if (!hasSupabaseEnv()) {
    redirect("/auth");
  }

  const user = await getSessionUser();
  if (!user) {
    redirect("/auth");
  }

  const profile = await getProfileByUserId(user.id);
  if (!profile) {
    redirect("/dashboard");
  }

  redirect(`/u/${profile.slug}`);
}
