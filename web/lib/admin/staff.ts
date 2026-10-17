import type { Database } from "@/lib/supabase/database.types";

export type RolStaff = Database["public"]["Enums"]["rol_staff"];

// Orden y textos de los roles en el panel. Qué puede cada uno: docs/plan-punto-de-venta.md
export const ROLES: { id: RolStaff; nombre: string; puede: string }[] = [
  { id: "vendedor", nombre: "Vendedor", puede: "Cobra en la caja, busca y carga clientes, abre y cierra su turno." },
  { id: "encargado", nombre: "Encargado", puede: "Lo del vendedor, más anular ventas, devoluciones, descuentos y retiros de caja." },
  { id: "admin", nombre: "Administrador", puede: "Todo, incluido este panel." },
];

export type PersonaStaff = {
  userId: string;
  email: string;
  nombre: string;
  rol: RolStaff;
  activo: boolean;
};
