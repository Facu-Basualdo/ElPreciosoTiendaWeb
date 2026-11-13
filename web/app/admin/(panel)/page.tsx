import { ArrowUpRightFromSquare, ChevronRight, CircleDollar, Receipt } from "@gravity-ui/icons";
import { Skeleton } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import type { Metadata } from "next";
import Image from "next/image";
import NextLink from "next/link";
import { Suspense } from "react";
import type { EstadoPedido } from "./pedidos/acciones";
import { BotonRefrescar } from "@/components/admin/boton-refrescar";
import { ListaPedidos } from "@/components/admin/pedidos/lista-pedidos";
import { CargaRapida } from "@/components/admin/productos/carga-rapida";
import { BotonNuevoProducto } from "@/components/admin/productos/nuevo-producto";
import { ZONA } from "@/lib/admin/fechas";
import { mesElegido, rangoMes } from "@/lib/admin/finanzas";
import { requerirAdmin } from "@/lib/auth";
import { formatearPrecio } from "@/lib/formato";
import { urlPublica } from "@/lib/supabase/storage";

export const metadata: Metadata = { title: "Inicio" };

const ACCION = "h-auto min-h-12 w-full justify-start whitespace-normal py-3 text-left";
const fechaLarga = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: ZONA });
const fechaCorta = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short", timeZone: ZONA });

// Lo primero que ve la dueña, casi siempre desde el celular: qué hay que atender (pedidos,
// borradores) y los atajos de todos los días. El shell (accesos) es estático; lo que lee
// la sesión va en su propio Suspense. Ver claude/web/dashboard.md#inicio
export default function InicioPanel() {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<Skeleton className="h-14 w-72 rounded-lg" />}>
        <Saludo />
      </Suspense>

      <nav aria-label="Accesos rápidos" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CargaRapida className={ACCION} />
        <BotonNuevoProducto className={ACCION} />
        <NextLink href="/admin/finanzas#cargar" className={`${buttonVariants({ variant: "outline" })} ${ACCION}`}>
          <CircleDollar />
          Cargar un gasto
        </NextLink>
        <NextLink href="/" target="_blank" className={`${buttonVariants({ variant: "outline" })} ${ACCION}`}>
          <ArrowUpRightFromSquare />
          Ver la tienda
        </NextLink>
      </nav>

      <Suspense fallback={<EsqueletoResumen />}>
        <Resumen />
      </Suspense>

      <div className="flex flex-col gap-3 rounded-tarjeta border border-dashed border-border p-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>¿Cambiaste datos por fuera del panel? &quot;Refrescar tienda&quot; vuelve a leer todo el catálogo.</p>
        <BotonRefrescar />
      </div>
    </div>
  );
}

async function Saludo() {
  const { supabase } = await requerirAdmin();
  const { data: claims } = await supabase.auth.getClaims();
  const { data: yo } = await supabase.from("staff").select("nombre").eq("user_id", claims?.claims.sub ?? "").maybeSingle();
  const nombre = yo?.nombre?.split(" ")[0];
  const hoy = fechaLarga.format(new Date());

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{nombre ? `¡Hola, ${nombre}!` : "¡Hola!"}</h1>
      <p className="text-sm text-muted">{hoy.charAt(0).toUpperCase() + hoy.slice(1)}</p>
    </div>
  );
}

async function Resumen() {
  const { supabase } = await requerirAdmin();
  const { desde, hasta } = rangoMes(mesElegido(undefined));

  const [productos, pedidos, pendientes, mes] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, publicado, actualizado_en, imagenes:producto_imagenes(path, orden)")
      .order("actualizado_en", { ascending: false })
      .limit(1000),
    supabase
      .from("pedidos")
      .select("id, numero, estado, nombre, total, creado_en, items:pedido_items(cantidad, combo_id, padre_id)")
      .in("estado", ["pendiente", "confirmado"])
      .order("creado_en", { ascending: false })
      .limit(6),
    supabase.from("pedidos").select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
    supabase.rpc("finanzas_por_mes", { p_desde: desde, p_hasta: hasta }),
  ]);

  const lista = productos.data ?? [];
  const visibles = lista.filter((p) => p.publicado).length;
  const borradores = lista.filter((p) => !p.publicado);
  const fila = mes.data?.[0];
  const ingresosMes = fila ? Number(fila.ventas) + Number(fila.otros_ingresos) : 0;
  const activos = pedidos.data ?? [];

  const cifras = [
    {
      titulo: "Pedidos pendientes",
      valor: String(pendientes.count ?? 0),
      detalle: "Esperando que los confirmes",
      href: "/admin/pedidos?estado=pendiente",
      destacada: (pendientes.count ?? 0) > 0,
    },
    {
      titulo: "Ingresos del mes",
      valor: formatearPrecio(ingresosMes),
      detalle: `${fila?.pedidos ?? 0} ${fila?.pedidos === 1 ? "pedido entregado" : "pedidos entregados"}`,
      href: "/admin/finanzas",
      destacada: false,
    },
    {
      titulo: "En la tienda",
      valor: String(visibles),
      detalle: `${borradores.length} ${borradores.length === 1 ? "borrador" : "borradores"} sin publicar`,
      href: "/admin/productos",
      destacada: false,
    },
  ];

  return (
    <>
      <ul className="grid grid-cols-3 gap-2 sm:gap-3">
        {cifras.map((c) => (
          <li key={c.titulo}>
            <NextLink
              href={c.href}
              className={`flex h-full flex-col gap-1 rounded-tarjeta border p-3 transition-colors sm:p-5 ${
                c.destacada ? "border-transparent bg-encabezado text-encabezado-foreground" : "border-border bg-surface hover:border-muted"
              }`}
            >
              <span className={`text-xs leading-tight sm:text-sm ${c.destacada ? "text-white/70" : "text-muted"}`}>{c.titulo}</span>
              <span className="text-lg font-semibold tabular-nums tracking-tight sm:text-3xl">{c.valor}</span>
              <span className={`hidden text-xs sm:block ${c.destacada ? "text-white/60" : "text-muted"}`}>{c.detalle}</span>
            </NextLink>
          </li>
        ))}
      </ul>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="pedidos-atender" className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="pedidos-atender" className="text-lg font-semibold">
              Pedidos para atender
            </h2>
            <NextLink href="/admin/pedidos" className="flex items-center gap-1 text-sm text-muted hover:text-foreground">
              Ver todos <ChevronRight className="size-3.5" />
            </NextLink>
          </div>
          {activos.length ? (
            <ListaPedidos
              pedidos={activos.map((p) => ({
                id: p.id,
                numero: p.numero,
                fecha: fechaCorta.format(new Date(p.creado_en)),
                nombre: p.nombre,
                unidades: p.items.filter((i) => !(i.combo_id && !i.padre_id)).reduce((n, i) => n + i.cantidad, 0),
                total: Number(p.total),
                estado: p.estado as EstadoPedido,
              }))}
            />
          ) : (
            <div className="flex items-center gap-3 rounded-tarjeta border border-border bg-surface p-5 text-sm text-muted">
              <Receipt className="size-5 shrink-0" aria-hidden />
              No hay pedidos pendientes ni confirmados. Cuando llegue uno por la tienda, aparece acá.
            </div>
          )}
        </section>

        <section aria-labelledby="borradores" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="borradores" className="text-lg font-semibold">
              Para completar
            </h2>
            {borradores.length > 0 && (
              <NextLink href="/admin/productos?estado=ocultos" className="flex items-center gap-1 text-sm text-muted hover:text-foreground">
                Ver {borradores.length} <ChevronRight className="size-3.5" />
              </NextLink>
            )}
          </div>
          {borradores.length ? (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-3">
              {borradores.slice(0, 6).map((p) => {
                const imagen = [...p.imagenes].sort((a, b) => a.orden - b.orden)[0]?.path;
                return (
                  <li key={p.id}>
                    <NextLink
                      href={`/admin/productos/${p.id}`}
                      className="group block overflow-hidden rounded-xl border border-border bg-surface"
                      title={`Completar ${p.nombre}`}
                    >
                      <span className="relative block aspect-[9/16] bg-surface-secondary">
                        {imagen && (
                          <Image src={urlPublica(imagen)} alt="" fill sizes="(max-width: 640px) 33vw, 7rem" className="object-cover" />
                        )}
                      </span>
                      <span className="block truncate px-2 py-1.5 text-xs group-hover:underline">{p.nombre}</span>
                    </NextLink>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-tarjeta border border-border bg-surface p-5 text-sm text-muted">Todo publicado. ¡Bien!</p>
          )}
        </section>
      </div>
    </>
  );
}

function EsqueletoResumen() {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 rounded-tarjeta sm:h-28" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-tarjeta" />
    </div>
  );
}
