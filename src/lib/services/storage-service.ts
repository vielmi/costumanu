/**
 * storage-service.ts
 *
 * Alle Storage-Operationen für Kostüm-Bilder.
 * Bucket-Name ist hier zentralisiert — bei AWS-Migration nur diese Datei anpassen.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "costume-images";

export function getPublicUrl(supabase: SupabaseClient, storagePath: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

export async function deleteFiles(
  supabase: SupabaseClient,
  paths: string[]
): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw error;
}

export async function uploadFile(
  supabase: SupabaseClient,
  path: string,
  file: File
): Promise<string> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });

  if (error) throw error;
  return path;
}
