"use server";

import { z } from "zod";
import { adminParaAccion, fallo, ok, type Resultado } from "@/lib/admin/accion";

// Server Actions de cajas del local. Patrón en claude/web/dashboard.md#patrón-de-server-action
// Sin caché que invalidar: las cajas sólo las leen el panel y el POS, en vivo.

const uuid = z.string().uuid();
const esquema = z.object({
  nombre: z.string().trim().min(1, "Escribí el nombre de la caja.").max(40),
  puntoVenta: z.number().int().min(1, "El punto de venta va de 1 a 99998.").max(99998, "El punto de venta va de 1 a 99998."),
});
export type DatosCaja = z.input<typeof esquema>;

function errorDeGuardado(e: { code?: string; message: string }) {
  if (e.code === "23505")
    return e.message.includes("punto_venta") ? "Otra caja ya usa ese punto de venta." : "Ya hay una caja con ese nombre.";
  return "No se pudo guardar la caja.";
}

export async function crearCaja(datos: DatosCaja): Promise<Resultado> {
  const { supabase, error } = await adminParaAccion();
  if (!supabase) return fallo(error);
  const r = esquema.safeParse(datos);
  if (!r.success) return fallo(r.error.issues[0]?.message ?? "Datos inválidos.");
  const { error: e } = await supabase.from("cajas").insert({ nombre: r.data.nombre, punto_venta: r.data.puntoVenta });
  if (e) return fallo(errorDeGuardado(e));
  return ok(undefined);
}

export async function guardarCaja(id: string, datos: DatosCaja): Promise<Resultado> {
  const { supabase, error } = await adminParaAccion();
  if (!supabase) return fallo(error);
  if (!uuid.safeParse(id).success) return fallo("Caja inválida.");
  const r = esquema.safeParse(datos);
  if (!r.success) return fallo(r.error.issues[0]?.message ?? "Datos inválidos.");
  const { error: e } = await supabase.from("cajas").update({ nombre: r.data.nombre, punto_venta: r.data.puntoVenta }).eq("id", id);
  if (e) return fallo(errorDeGuardado(e));
  return ok(undefined);
}

export async function cambiarActiva(id: string, activa: boolean): Promise<Resultado> {
  const { supabase, error } = await adminParaAccion();
  if (!supabase) return fallo(error);
  if (!uuid.safeParse(id).success) return fallo("Caja inválida.");
  const { error: e } = await supabase.from("cajas").update({ activa }).eq("id", id);
  if (e) return fallo("No se pudo cambiar el estado.");
  return ok(undefined);
}

export async function borrarCaja(id: string): Promise<Resultado> {
  const { supabase, error } = await adminParaAccion();
  if (!supabase) return fallo(error);
  if (!uuid.safeParse(id).success) return fallo("Caja inválida.");
  const { error: e } = await supabase.from("cajas").delete().eq("id", id);
  // 23503: ya tiene turnos o ventas (fase 4 en adelante); se apaga, no se borra.
  if (e?.code === "23503") return fallo("Esta caja ya tiene ventas: apagala en vez de borrarla.");
  if (e) return fallo("No se pudo borrar la caja.");
  return ok(undefined);
}
