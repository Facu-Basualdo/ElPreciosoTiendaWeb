"use server";

import { z } from "zod";
import { adminParaAccion, fallo, ok, type Resultado } from "@/lib/admin/accion";
import { CATEGORIAS, MEDIOS } from "@/lib/admin/finanzas";

// Server Actions de Finanzas. Patrón en claude/web/dashboard.md#patrón-de-server-action
// Sin caché que invalidar: Finanzas sólo se lee en el panel, en vivo.

const esquema = z
  .object({
    tipo: z.enum(["gasto", "ingreso"]),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elegí la fecha."),
    monto: z.number({ message: "Escribí el monto." }).int("Sin centavos.").positive("El monto tiene que ser mayor a cero.").max(100_000_000),
    categoria: z.string(),
    medio: z.enum(Object.keys(MEDIOS) as [keyof typeof MEDIOS, ...(keyof typeof MEDIOS)[]]),
    nota: z.string().trim().max(200, "La nota admite hasta 200 caracteres.").optional(),
  })
  .refine((d) => d.categoria in CATEGORIAS[d.tipo], { message: "Elegí una categoría.", path: ["categoria"] });
export type DatosMovimiento = z.input<typeof esquema>;

export async function crearMovimiento(datos: DatosMovimiento): Promise<Resultado> {
  const { supabase, error } = await adminParaAccion();
  if (!supabase) return fallo(error);
  const r = esquema.safeParse(datos);
  if (!r.success) return fallo(r.error.issues[0]?.message ?? "Datos inválidos.");
  const { error: e } = await supabase.from("movimientos_dinero").insert({
    tipo: r.data.tipo,
    fecha: r.data.fecha,
    monto: r.data.monto,
    categoria: r.data.categoria,
    medio: r.data.medio,
    nota: r.data.nota || null,
  });
  if (e) return fallo("No se pudo guardar el movimiento.");
  return ok(undefined);
}

export async function borrarMovimiento(id: number): Promise<Resultado> {
  const { supabase, error } = await adminParaAccion();
  if (!supabase) return fallo(error);
  if (!Number.isInteger(id) || id <= 0) return fallo("Movimiento inválido.");
  const { error: e } = await supabase.from("movimientos_dinero").delete().eq("id", id);
  if (e) return fallo("No se pudo borrar el movimiento.");
  return ok(undefined);
}
