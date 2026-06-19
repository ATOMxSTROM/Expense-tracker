import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Profile } from "@/app/generated/prisma/client";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return null;

  return prisma.profile.findUnique({ where: { id: userId } });
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export function isFullAccess(profile: Profile) {
  return profile.role === "OWNER" || profile.role === "ADMIN";
}
