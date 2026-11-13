import { ChevronLeft, ChevronRight } from "@gravity-ui/icons";
import { Skeleton } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import type { Metadata } from "next";
import NextLink from "next/link";
import { Suspense } from "react";
import type { EstadoPedido } from "./acciones";
import { FILTROS_ESTADO, FiltrosPedidos, type FiltroEstado } from "@/components/admin/pedidos/filtros-pedidos";
import { ListaPedidos } from "@/components/admin/pedidos/lista-pedidos";
import { requerirAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Pedidos" };

const POR_PAGINA = 30;
const fecha = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" });

// Shell estático + datos en su propio Suspense. Ver claude/web/dashboard.md#páginas-del-panel
export default function PaginaPedidos(props: PageProps<"/admin/pedidos">) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>
        <p className="text-sm text-muted">Llegan desde el carrito de la tienda. Tocá un pedido para ver el detalle; el estado se cambia desde acá.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-12 rounded-xl" />}>
        <FiltrosPedidos />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 rounded-tarjeta" />}>
        <Listado searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Listado({ searchParams }: { searchParams: PageProps<"/admin/pedidos">["searchParams"] }) {
  const sp = await searchParams;
  const { supabase } = await requerirAdmin();
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const estado = (typeof sp.estado === "string" && sp.estado in FILTROS_ESTADO ? sp.estado : "activos") as FiltroEstado;
  const pagina = Math.max(1, Number(sp.pagina) || 1);

  let consulta = supabase
    .from("pedidos")
    .select("id, numero, estado, nombre, total, creado_en, items:pedido_items(cantidad, combo_id, padre_id)", { count: "exact" })
    .order("creado_en", { ascending: false })
    .range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);
  if (estado === "activos") consulta = consulta.in("estado", ["pendiente", "confirmado"]);
  else if (estado !== "todos") consulta = consulta.eq("estado", estado);
  if (q) {
    const numero = Number(q.replace(/^#/, ""));
    consulta = Number.isInteger(numero) && numero > 0 ? consulta.eq("numero", numero) : consulta.ilike("nombre", `%${q}%`);
  }
  const { data, count, error } = await consulta;
  if (error) return <p className="text-danger">No se pudieron leer los pedidos.</p>;

  const total = count ?? 0;
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const url = (n: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (estado !== "activos") p.set("estado", estado);
    if (n > 1) p.set("pagina", String(n));
    return `/admin/pedidos${p.size ? `?${p}` : ""}`;
  };

  if (!data.length) {
    return <p className="rounded-tarjeta border border-border bg-surface p-8 text-center text-muted">No hay pedidos con estos filtros.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        {total} {total === 1 ? "pedido" : "pedidos"}
      </p>
      <ListaPedidos
        pedidos={data.map((p) => ({
          id: p.id,
          numero: p.numero,
          fecha: fecha.format(new Date(p.creado_en)),
          nombre: p.nombre,
          // Sin las filas padre de combo: sus unidades ya están en las hijas.
          unidades: p.items.filter((i) => !(i.combo_id && !i.padre_id)).reduce((n, i) => n + i.cantidad, 0),
          total: Number(p.total),
          estado: p.estado as EstadoPedido,
        }))}
      />
      {paginas > 1 && (
        <nav aria-label="Paginación" className="flex items-center justify-end gap-2 text-sm">
          {pagina > 1 && (
            <NextLink href={url(pagina - 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <ChevronLeft /> Anterior
            </NextLink>
          )}
          <span className="text-muted">
            Página {pagina} de {paginas}
          </span>
          {pagina < paginas && (
            <NextLink href={url(pagina + 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Siguiente <ChevronRight />
            </NextLink>
          )}
        </nav>
      )}
    </div>
  );
}
