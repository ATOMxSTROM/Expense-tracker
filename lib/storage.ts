import { createClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function getSignedAttachmentUrl(path: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error) return null;
  return data.signedUrl;
}
