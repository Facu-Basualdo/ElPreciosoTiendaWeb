"use client";

import { ArrowDownToSquare, TrashBin } from "@gravity-ui/icons";
import { AlertDialog, Button, Chip, toast } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { borrarMovimiento } from "@/app/admin/(panel)/finanzas/acciones";
import { etiquetaCategoria, MEDIOS, type Medio } from "@/lib/admin/finanzas";
import { formatearPrecio } from "@/lib/formato";

export type Movimiento = {
  id: number;
  tipo: string;
  fecha: string;
  monto: number;
  categoria: string;
  medio: string;
  nota: string | null;
};
export type PedidoEntregado = { numero: number; nombre: string; fecha: string; total: number };

const fecha = (d: string) => d.split("-").reverse().join("/");

// Lista y no Table: cada fila tiene su botón de borrar (ver claude/web/heroui.md).
export function ListaMovimientos({ movimientos }: { movimientos: Movimiento[] }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [borrar, setBorrar] = useState<Movimiento | null>(null);

  if (!movimientos.length) return <p className="text-sm text-muted">No hay movimientos cargados este mes.</p>;

  return (
    <>
      <ul className="flex flex-col divide-y divide-separator rounded-xl border border-border">
        {movimientos.map((m) => (
          <li key={m.id} className="flex items-center gap-3 px-3 py-2.5">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-center gap-2 text-sm font-medium">
                {etiquetaCategoria(m.tipo, m.categoria)}
                <Chip size="sm" variant={m.tipo === "gasto" ? "secondary" : "primary"}>
                  {m.tipo === "gasto" ? "Gasto" : "Ingreso"}
                </Chip>
              </span>
              <span className="truncate text-xs text-muted">
                {[fecha(m.fecha), MEDIOS[m.medio as Medio] ?? m.medio, m.nota].filter(Boolean).join(" · ")}
              </span>
            </div>
            <span className="font-medium tabular-nums">
              {m.tipo === "gasto" ? "-" : "+"}
              {formatearPrecio(m.monto)}
            </span>
            <Button isIconOnly size="sm" variant="ghost" aria-label={`Borrar ${etiquetaCategoria(m.tipo, m.categoria)} del ${fecha(m.fecha)}`} onPress={() => setBorrar(m)}>
              <TrashBin />
            </Button>
          </li>
        ))}
      </ul>

      <AlertDialog.Backdrop isOpen={!!borrar} onOpenChange={(abierto) => !abierto && setBorrar(null)}>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>¿Borrar este movimiento?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              {borrar && `${etiquetaCategoria(borrar.tipo, borrar.categoria)} del ${fecha(borrar.fecha)} por ${formatearPrecio(borrar.monto)}.`}
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant="ghost" onPress={() => setBorrar(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                isPending={pendiente}
                onPress={() => {
                  if (!borrar) return;
                  const id = borrar.id;
                  iniciar(async () => {
                    const r = await borrarMovimiento(id);
                    if (!r.ok) return void toast.danger(r.error);
                    setBorrar(null);
                    toast("Movimiento borrado");
                    router.refresh();
                  });
                }}
              >
                Borrar
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </>
  );
}

const celda = (v: string | number) => {
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

/**
 * CSV del mes (pedidos entregados + movimientos) para abrir en Excel: separador ";" y
 * BOM, que es lo que espera el Excel en español.
 */
export function ExportarCsv({ mes, pedidos, movimientos }: { mes: string; pedidos: PedidoEntregado[]; movimientos: Movimiento[] }) {
  function descargar() {
    const filas = [
      ["Fecha", "Tipo", "Categoría", "Detalle", "Medio", "Monto"],
      ...pedidos.map((p) => [p.fecha, "Ingreso", "Pedido web", `Pedido Nº ${p.numero} · ${p.nombre}`, "", p.total]),
      ...movimientos.map((m) => [
        m.fecha,
        m.tipo === "gasto" ? "Gasto" : "Ingreso",
        etiquetaCategoria(m.tipo, m.categoria),
        m.nota ?? "",
        MEDIOS[m.medio as Medio] ?? m.medio,
        m.tipo === "gasto" ? -m.monto : m.monto,
      ]),
    ];
    const csv = "﻿" + filas.map((f) => f.map(celda).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `finanzas-${mes}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onPress={descargar} isDisabled={!pedidos.length && !movimientos.length}>
      <ArrowDownToSquare />
      Exportar CSV
    </Button>
  );
}
