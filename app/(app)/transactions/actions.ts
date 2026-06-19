"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { PaymentMethod, TransactionType } from "@/app/generated/prisma/client";

export async function createTransaction(formData: FormData) {
  const profile = await requireProfile();

  const type = String(formData.get("type") ?? "") as TransactionType;
  const amount = String(formData.get("amount") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const clientId = String(formData.get("clientId") ?? "") || null;
  const projectId = String(formData.get("projectId") ?? "") || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const paymentMethod = String(formData.get("paymentMethod") ?? "OTHER") as PaymentMethod;

  if (!amount || !date || !categoryId) {
    throw new Error("Amount, date and category are required");
  }

  let attachmentUrl: string | null = null;
  const file = formData.get("attachment");
  if (file instanceof File && file.size > 0) {
    const supabase = await createClient();
    const path = `${profile.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("attachments").upload(path, file);
    if (error) throw new Error(`Attachment upload failed: ${error.message}`);
    attachmentUrl = path;
  }

  await prisma.transaction.create({
    data: {
      type,
      amount,
      date: new Date(date),
      categoryId,
      clientId,
      projectId,
      description,
      paymentMethod,
      attachmentUrl,
      createdBy: profile.id,
    },
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export async function deleteTransaction(formData: FormData) {
  const profile = await requireProfile();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing transaction id");

  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (!transaction) return;

  const isFullAccess = profile.role === "OWNER" || profile.role === "ADMIN";
  if (!isFullAccess && transaction.createdBy !== profile.id) {
    throw new Error("Not allowed to delete this transaction");
  }

  if (transaction.attachmentUrl) {
    const supabase = await createClient();
    await supabase.storage.from("attachments").remove([transaction.attachmentUrl]);
  }

  await prisma.transaction.delete({ where: { id } });
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}
