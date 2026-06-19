import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Profile } from "@/app/generated/prisma/client";

export async function getCurrentProfile(): Promise<Profile | null> {
  // proxy.ts already verified the JWT and forwards the user id here,
  // so we skip re-verifying it (one less round trip to Supabase Auth).
  const userId = (await headers()).get("x-user-id");
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
