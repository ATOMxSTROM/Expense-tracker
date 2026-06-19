"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/auth";

export async function createClientRecord(formData: FormData) {
  await requireProfile();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Client name is required");

  const contactEmail = String(formData.get("contactEmail") ?? "").trim() || null;
  const contactPhone = String(formData.get("contactPhone") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await prisma.client.create({
    data: { name, contactEmail, contactPhone, notes },
  });

  revalidatePath("/clients");
}

export async function deleteClient(formData: FormData) {
  await requireProfile();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing client id");

  await prisma.client.delete({ where: { id } });
  revalidatePath("/clients");
}
