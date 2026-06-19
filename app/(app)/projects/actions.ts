"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/auth";
import type { ProjectStatus } from "@/app/generated/prisma/client";

export async function createProject(formData: FormData) {
  await requireProfile();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Project name is required");

  const clientId = String(formData.get("clientId") ?? "") || null;
  const status = String(formData.get("status") ?? "ACTIVE") as ProjectStatus;
  const budgetRaw = String(formData.get("budget") ?? "").trim();
  const budget = budgetRaw ? budgetRaw : null;

  await prisma.project.create({
    data: { name, clientId, status, budget },
  });

  revalidatePath("/projects");
}

export async function deleteProject(formData: FormData) {
  await requireProfile();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing project id");

  await prisma.project.delete({ where: { id } });
  revalidatePath("/projects");
}
