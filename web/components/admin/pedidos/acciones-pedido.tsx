"use client";

import { AlertDialog, Button, toast } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cambiarEstado, type EstadoPedido } from "@/app/admin/(panel)/pedidos/acciones";
import { NOMBRE_ESTADO } from "./estado";

type Transicion = { a: EstadoPedido; etiqueta: string; variante: "primary" | "outline" | "danger-soft"; aviso?: string };

// Qué se puede hacer desde cada estado. Sin stock (todo es a pedido), sólo cancelar
// pide confirmación; igual se puede reabrir.
const CANCELAR = "El pedido deja de estar activo. Podés reabrirlo después si hace falta.";
const TRANSICIONES: Record<EstadoPedido, Transicion[]> = {
  pendiente: [
    { a: "confirmado", etiqueta: "Confirmar", variante: "primary" },
    { a: "cancelado", etiqueta: "Cancelar", variante: "danger-soft", aviso: CANCELAR },
  ],
  confirmado: [
    { a: "entregado", etiqueta: "Marcar entregado", variante: "primary" },
    { a: "pendiente", etiqueta: "Volver a pendiente", variante: "outline" },
    { a: "cancelado", etiqueta: "Cancelar", variante: "danger-soft", aviso: CANCELAR },
  ],
  entregado: [{ a: "confirmado", etiqueta: "Volver a confirmado", variante: "outline" }],
  cancelado: [
    { a: "pendiente", etiqueta: "Reabrir", variante: "outline" },
    { a: "confirmado", etiqueta: "Confirmar", variante: "primary" },
  ],
};

export function AccionesPedido({ id, estado, numero }: { id: string; estado: EstadoPedido; numero: number }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [confirmando, setConfirmando] = useState<Transicion | null>(null);

  const ejecutar = (t: Transicion) =>
    iniciar(async () => {
      const r = await cambiarEstado(id, t.a);
      if (!r.ok) return void toast.danger(r.error);
      setConfirmando(null);
      toast(`Pedido #${numero}: ${NOMBRE_ESTADO[t.a].toLowerCase()}`);
      router.refresh();
    });

  return (
    <div className="flex flex-wrap gap-2">
      {TRANSICIONES[estado].map((t) => (
        <Button key={t.a} variant={t.variante} isPending={pendiente && !confirmando} onPress={() => (t.aviso ? setConfirmando(t) : ejecutar(t))}>
          {t.etiqueta}
        </Button>
      ))}

      <AlertDialog.Backdrop isOpen={!!confirmando} onOpenChange={(abierto) => !abierto && setConfirmando(null)}>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Icon status={confirmando?.variante === "danger-soft" ? "danger" : "accent"} />
              <AlertDialog.Heading>
                {confirmando?.etiqueta} el pedido #{numero}
              </AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>{confirmando?.aviso}</AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant="ghost" onPress={() => setConfirmando(null)}>
                Volver
              </Button>
              <Button
                variant={confirmando?.variante === "danger-soft" ? "danger" : "primary"}
                isPending={pendiente}
                onPress={() => confirmando && ejecutar(confirmando)}
              >
                {confirmando?.etiqueta}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </div>
  );
}
