"use server";

import { z } from "zod";
import { adminParaAccion, fallo, ok, type Resultado } from "@/lib/admin/accion";
import { supabasePublico } from "@/lib/supabase/publico";

// Cambio de la contraseña propia desde el panel. Pide la actual: con el panel abierto en
// un celular ajeno no alcanza para cambiarla. Ver claude/web/dashboard.md#mi-contraseña

const esquema = z
  .object({
    actual: z.string().min(1, "Escribí tu contraseña actual."),
    nueva: z.string().min(8, "La nueva tiene que tener al menos 8 caracteres.").max(72, "Hasta 72 caracteres."),
    repetida: z.string(),
  })
  .refine((d) => d.nueva === d.repetida, { message: "Las dos contraseñas nuevas no coinciden.", path: ["repetida"] })
  .refine((d) => d.nueva !== d.actual, { message: "La nueva tiene que ser distinta de la actual.", path: ["nueva"] });
export type DatosContrasena = z.input<typeof esquema>;

export async function cambiarContrasena(datos: DatosContrasena): Promise<Resultado> {
  const { supabase, error } = await adminParaAccion();
  if (!supabase) return fallo(error);
  const r = esquema.safeParse(datos);
  if (!r.success) return fallo(r.error.issues[0]?.message ?? "Datos inválidos.");

  const { data: claims } = await supabase.auth.getClaims();
  const email = claims?.claims.email;
  if (typeof email !== "string") return fallo("No se pudo leer tu usuario. Volvé a iniciar sesión.");

  // La actual se verifica con un cliente sin cookies: no toca la sesión del panel. La
  // sesión de esa verificación se cierra enseguida.
  const verificador = supabasePublico();
  const { error: eActual } = await verificador.auth.signInWithPassword({ email, password: r.data.actual });
  if (eActual) return fallo("La contraseña actual no es correcta.");
  await verificador.auth.signOut({ scope: "local" });

  const { error: eNueva } = await supabase.auth.updateUser({ password: r.data.nueva });
  if (eNueva) {
    if (eNueva.code === "weak_password") return fallo("Esa contraseña es muy débil: probá con una más larga o con números y símbolos.");
    if (eNueva.code === "same_password") return fallo("La nueva tiene que ser distinta de la actual.");
    return fallo("No se pudo cambiar la contraseña.");
  }
  return ok(undefined);
}
