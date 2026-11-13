"use client";

import { Label, ListBox, Select, toast } from "@heroui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cambiarEstado, type EstadoPedido } from "@/app/admin/(panel)/pedidos/acciones";
import { formatearPrecio } from "@/lib/formato";
import { NOMBRE_ESTADO } from "./estado";

export type FilaPedido = {
  id: string;
  numero: number;
  fecha: string;
  nombre: string;
  unidades: number;
  total: number;
  estado: EstadoPedido;
};

const ESTADOS = Object.keys(NOMBRE_ESTADO) as EstadoPedido[];
const PUNTO: Record<EstadoPedido, string> = {
  pendiente: "bg-dorado",
  confirmado: "bg-celeste-oscuro",
  entregado: "bg-noche",
  cancelado: "bg-muted",
};
const COLUMNAS = "md:grid md:grid-cols-[5rem_9rem_1fr_5rem_7rem_11rem] md:items-center md:gap-4";

/**
 * Lista y no Table: la Table de HeroUI es un grid de React Aria que captura flechas y
 * clics, y pelea con el Select de cada fila. Toda la fila lleva al detalle (el link del
 * número se estira con `after:inset-0`); el Select queda por encima y cambia el estado
 * ahí mismo, con "Deshacer" en el aviso.
 */
export function ListaPedidos({ pedidos }: { pedidos: FilaPedido[] }) {
  return (
    <div className="overflow-hidden rounded-tarjeta border border-border bg-surface">
      <div aria-hidden className={`hidden bg-surface-secondary px-4 py-2.5 text-xs font-medium text-muted ${COLUMNAS}`}>
        <span>Pedido</span>
        <span>Fecha</span>
        <span>Cliente</span>
        <span>Unidades</span>
        <span>Total</span>
        <span>Estado</span>
      </div>
      <ul className="divide-y divide-separator">
        {pedidos.map((p) => (
          <Fila key={p.id} pedido={p} />
        ))}
      </ul>
    </div>
  );
}

function Fila({ pedido: p }: { pedido: FilaPedido }) {
  return (
    <li className={`relative flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 transition-colors hover:bg-surface-secondary ${COLUMNAS}`}>
      <NextLink
        href={`/admin/pedidos/${p.id}`}
        className="font-semibold outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-focus"
      >
        #{p.numero}
        <span className="sr-only"> de {p.nombre}, ver detalle</span>
      </NextLink>
      <span className="order-last w-full text-xs text-muted md:order-none md:w-auto md:text-sm">
        {p.fecha}
        <span className="md:hidden">
          {" "}
          · {p.unidades} u. · {formatearPrecio(p.total)}
        </span>
      </span>
      <span className="flex-1 truncate md:flex-none">{p.nombre}</span>
      <span className="hidden tabular-nums md:block">{p.unidades}</span>
      <span className="hidden tabular-nums md:block">{formatearPrecio(p.total)}</span>
      {/* relative + z-10: por encima del link estirado, así tocar el Select no abre el detalle. */}
      <div className="relative z-10 ml-auto w-40 md:ml-0 md:w-full">
        <SelectorEstado id={p.id} numero={p.numero} estado={p.estado} />
      </div>
    </li>
  );
}

export function SelectorEstado({ id, numero, estado }: { id: string; numero: number; estado: EstadoPedido }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();

  const cambiar = (nuevo: EstadoPedido, anterior: EstadoPedido | null) =>
    iniciar(async () => {
      const r = await cambiarEstado(id, nuevo);
      if (!r.ok) return void toast.danger(r.error);
      router.refresh();
      toast(`Pedido #${numero}: ${NOMBRE_ESTADO[nuevo].toLowerCase()}`, {
        actionProps: anterior
          ? { children: "Deshacer", onPress: () => cambiar(anterior, null), variant: "tertiary" }
          : undefined,
      });
    });

  return (
    <Select
      aria-label={`Estado del pedido #${numero}`}
      value={estado}
      isDisabled={pendiente}
      onChange={(v) => {
        if (typeof v === "string" && v !== estado) cambiar(v as EstadoPedido, estado);
      }}
    >
      <Label className="sr-only">Estado</Label>
      <Select.Trigger>
        <Select.Value>
          <span className="flex items-center gap-2">
            <span aria-hidden className={`size-2 rounded-full ${PUNTO[estado]}`} />
            {NOMBRE_ESTADO[estado]}
          </span>
        </Select.Value>
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {ESTADOS.map((e) => (
            <ListBox.Item key={e} id={e} textValue={NOMBRE_ESTADO[e]}>
              <span className="flex items-center gap-2">
                <span aria-hidden className={`size-2 rounded-full ${PUNTO[e]}`} />
                {NOMBRE_ESTADO[e]}
              </span>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
