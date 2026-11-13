import { BUCKET } from "@/lib/supabase/storage";
import { supabaseNavegador } from "@/lib/supabase/navegador";

/**
 * Sube un WebP directo del navegador a Storage (los Server Actions cortan en 1 MB) y
 * devuelve su path. Nombre nuevo siempre: sobrescribir un path deja la versión vieja en
 * el CDN. Ver claude/web/imagenes.md
 */
export async function subirWebp(carpeta: string, blob: Blob): Promise<string> {
  const path = `${carpeta}/${crypto.randomUUID()}.webp`;
  const { error } = await supabaseNavegador().storage.from(BUCKET).upload(path, blob, { contentType: "image/webp", upsert: false });
  if (error) throw new Error(error.message);
  return path;
}
