// Etiquetas y meses de Finanzas. Los meses son de Argentina (los mismos que usa la base
// en finanzas_por_mes). Ver claude/web/finanzas.md
import { ZONA } from "./fechas";

export const CATEGORIAS = {
  gasto: { materiales: "Materiales", packaging: "Packaging", envios: "Envíos", publicidad: "Publicidad", otros: "Otros" },
  ingreso: { venta_en_mano: "Venta en mano", feria: "Feria", otros: "Otros" },
} as const;
export type TipoMovimiento = keyof typeof CATEGORIAS;

export const MEDIOS = { efectivo: "Efectivo", transferencia: "Transferencia" } as const;
export type Medio = keyof typeof MEDIOS;

export const etiquetaCategoria = (tipo: string, categoria: string) =>
  (CATEGORIAS[tipo as TipoMovimiento] as Record<string, string> | undefined)?.[categoria] ?? categoria;

const diaAr = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" });

/** Hoy en Argentina, "YYYY-MM-DD". */
export const hoy = () => diaAr.format(new Date());

/** "YYYY-MM" válido o el mes actual. */
export function mesElegido(valor: string | string[] | undefined): string {
  return typeof valor === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(valor) ? valor : hoy().slice(0, 7);
}

/** Primer y último día de un mes "YYYY-MM". */
export function rangoMes(mes: string): { desde: string; hasta: string } {
  const [a, m] = mes.split("-").map(Number);
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return { desde: `${mes}-01`, hasta: `${mes}-${String(ultimo).padStart(2, "0")}` };
}

/** "YYYY-MM" corrido n meses. */
export function correrMes(mes: string, n: number): string {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

const nombreMes = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });
const nombreMesCorto = new Intl.DateTimeFormat("es-AR", { month: "short", timeZone: "UTC" });

/** "noviembre de 2026" → "Noviembre 2026". */
export const etiquetaMes = (mes: string) => {
  const t = nombreMes.format(new Date(`${mes}-01T00:00:00Z`)).replace(" de ", " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
};
export const etiquetaMesCorta = (mes: string) => nombreMesCorto.format(new Date(`${mes}-01T00:00:00Z`)).replace(".", "");
