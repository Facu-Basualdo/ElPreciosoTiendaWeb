"use server";

import { z } from "zod";
import { adminParaAccion, fallo, ok, type Resultado } from "@/lib/admin/accion";

// Server Actions del personal (tabla staff). Patrón en claude/web/dashboard.md#patrón-de-server-action
// Sin caché que invalidar: staff no aparece en ninguna lectura cacheada.
// El alta usa asignar_staff (la persona tiene que tener cuenta); RLS exige es_admin y un
// trigger impide dejar el sistema sin admin activo. Ver claude/supabase/seguridad-rls.md

const uuid = z.string().uuid();
const rol = z.enum(["admin", "encargado", "vendedor"]);

// Errores de la base que el admin tiene que leer tal cual.
const MENSAJES = ["No hay ningún usuario", "Tiene que quedar al menos un admin"];
const mensaje = (e: { message: string }, otro: string) => (MENSAJES.some((m) => e.message.startsWith(m)) ? e.message : otro);

const esquemaAlta = z.object({
  email: z.string().trim().toLowerCase().email("Escribí un email válido."),
  nombre: z.string().trim().min(1, "Escribí el nombre.").max(80),
  rol,
});
export type DatosPersona = z.input<typeof esquemaAlta>;

export async function agregarPersona(datos: DatosPersona): Promise<Resultado> {
  const { supabase, error } = await adminParaAccion();
  if (!supabase) return fallo(error);
  const r = esquemaAlta.safeParse(datos);
  if (!r.success) return fallo(r.error.issues[0]?.message ?? "Datos inválidos.");
  const { error: e } = await supabase.rpc("asignar_staff", {
    p_email: r.data.email,
    p_nombre: r.data.nombre,
    p_rol: r.data.rol,
  });
  if (e) return fallo(mensaje(e, "No se pudo agregar a la persona."));
  return ok(undefined);
}

export async function cambiarRol(userId: string, nuevo: z.input<typeof rol>): Promise<Resultado> {
  const { supabase, error } = await adminParaAccion();
  if (!supabase) return fallo(error);
  if (!uuid.safeParse(userId).success || !rol.safeParse(nuevo).success) return fallo("Datos inválidos.");
  const { error: e } = await supabase.from("staff").update({ rol: nuevo }).eq("user_id", userId);
  if (e) return fallo(mensaje(e, "No se pudo cambiar el rol."));
  return ok(undefined);
}

export async function cambiarActivo(userId: string, activo: boolean): Promise<Resultado> {
  const { supabase, error } = await adminParaAccion();
  if (!supabase) return fallo(error);
  if (!uuid.safeParse(userId).success) return fallo("Datos inválidos.");
  const { error: e } = await supabase.from("staff").update({ activo }).eq("user_id", userId);
  if (e) return fallo(mensaje(e, "No se pudo cambiar el estado."));
  return ok(undefined);
}

export async function quitarPersona(userId: string): Promise<Resultado> {
  const { supabase, error } = await adminParaAccion();
  if (!supabase) return fallo(error);
  if (!uuid.safeParse(userId).success) return fallo("Datos inválidos.");
  // Borra el permiso, no la cuenta: si también compra en la tienda, sigue pudiendo entrar.
  const { error: e } = await supabase.from("staff").delete().eq("user_id", userId);
  if (e) return fallo(mensaje(e, "No se pudo quitar a la persona."));
  return ok(undefined);
}
