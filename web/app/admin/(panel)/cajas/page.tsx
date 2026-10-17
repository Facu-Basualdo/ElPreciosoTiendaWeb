import { Skeleton } from "@heroui/react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ListaCajas } from "@/components/admin/cajas/lista-cajas";
import { requerirAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Cajas" };

// Shell estático + datos en su propio Suspense. Ver claude/web/dashboard.md#páginas-del-panel
export default function PaginaCajas() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cajas</h1>
        <p className="text-sm text-muted">
          Las computadoras del local que cobran con el programa de caja. Al abrirlo, cada vendedor elige en cuál está.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-48 rounded-tarjeta" />}>
        <Listado />
      </Suspense>
    </div>
  );
}

async function Listado() {
  const { supabase } = await requerirAdmin();
  const { data, error } = await supabase.from("cajas").select("id, nombre, punto_venta, activa").order("punto_venta");
  if (error) return <p className="text-danger">No se pudieron leer las cajas.</p>;
  return <ListaCajas cajas={data.map((c) => ({ id: c.id, nombre: c.nombre, puntoVenta: c.punto_venta, activa: c.activa }))} />;
}
