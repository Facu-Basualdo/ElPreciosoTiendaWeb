import { ChevronLeft, ChevronRight } from "@gravity-ui/icons";
import { Skeleton } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import type { Metadata } from "next";
import NextLink from "next/link";
import { Suspense } from "react";
import {
  ESTADOS,
  FiltrosListado,
  type Estado,
} from "@/components/admin/productos/filtros-listado";
import { CargaRapida } from "@/components/admin/productos/carga-rapida";
import { BotonNuevoProducto } from "@/components/admin/productos/nuevo-producto";
import { ListaProductos } from "@/components/admin/productos/lista-productos";
import { requerirAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Productos" };

const POR_PAGINA = 48; // parejo en 2, 3, 4, 6 u 8 columnas de la grilla

// Server component: a los componentes de HeroUI (client) sólo props serializables;
// nada de renderEmptyState ni otras funciones desde acá.
// Shell estático + datos en su propio Suspense. Ver claude/web/dashboard.md#páginas-del-panel
export default function PaginaProductos(props: PageProps<"/admin/productos">) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
          <p className="text-sm text-muted">
            Tocá un producto para editarlo. El interruptor lo muestra u oculta
            en la tienda. «Cargar fotos» crea un borrador por cada foto.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CargaRapida />
          <BotonNuevoProducto />
        </div>
      </div>
      <Suspense fallback={<Skeleton className="h-12 rounded-xl" />}>
        <FiltrosListado />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 rounded-tarjeta" />}>
        <Listado searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

// El que ve la gente: el más bajo de las bases que se ofrecen (vacío = el del producto).
// Un producto en 0 con bases con precio NO está "sin precio".
function precioEfectivo(base: number, variantes: { precio: number | null; activa: boolean }[]) {
  const activas = variantes.filter((v) => v.activa);
  return activas.length ? Math.min(...activas.map((v) => Number(v.precio ?? base))) : base;
}

async function Listado({
  searchParams,
}: {
  searchParams: PageProps<"/admin/productos">["searchParams"];
}) {
  const sp = await searchParams;
  const { supabase } = await requerirAdmin();
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const estado = (
    typeof sp.estado === "string" && sp.estado in ESTADOS ? sp.estado : "todos"
  ) as Estado;
  const pagina = Math.max(1, Number(sp.pagina) || 1);

  let consulta = supabase
    .from("productos")
    .select(
      `id, slug, nombre, precio, publicado, actualizado_en,
       categoria:categorias(nombre),
       imagenes:producto_imagenes(path, orden),
       variantes:producto_variantes(sku, precio, activa)`,
    )
    .order("actualizado_en", { ascending: false })
    .limit(1000);
  if (estado === "visibles") consulta = consulta.eq("publicado", true);
  if (estado === "ocultos") consulta = consulta.eq("publicado", false);
  const { data, error } = await consulta;
  if (error)
    return <p className="text-danger">No se pudieron leer los productos.</p>;

  // Búsqueda por nombre o SKU se resuelve acá: el SKU vive en las
  // variantes y PostgREST no filtra por un agregado. Alcanza para catálogos de cientos
  // de productos (tope 1000); con más, pasar a un RPC.
  const qn = q.toLowerCase();
  const filas = data
    .map((p) => ({
      ...p,
      imagen:
        [...p.imagenes].sort((a, b) => a.orden - b.orden)[0]?.path ?? null,
    }))
    .filter(
      (p) =>
        !qn ||
        p.nombre.toLowerCase().includes(qn) ||
        p.variantes.some((v) => v.sku?.toLowerCase().includes(qn)),
    );

  const paginas = Math.max(1, Math.ceil(filas.length / POR_PAGINA));
  const visibles = filas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const url = (n: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (estado !== "todos") p.set("estado", estado);
    if (n > 1) p.set("pagina", String(n));
    return `/admin/productos${p.size ? `?${p}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        {filas.length} {filas.length === 1 ? "producto" : "productos"}
      </p>
      {visibles.length === 0 ? (
        <p className="rounded-tarjeta border border-border bg-surface p-8 text-center text-muted">
          No hay productos con estos filtros.
        </p>
      ) : (
        <ListaProductos
          productos={visibles.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            imagen: p.imagen,
            categoria: p.categoria?.nombre ?? null,
            precio: precioEfectivo(Number(p.precio), p.variantes),
            publicado: p.publicado,
          }))}
        />
      )}

      {paginas > 1 && (
        <nav
          aria-label="Paginación"
          className="flex items-center justify-end gap-2 text-sm"
        >
          {pagina > 1 && (
            <NextLink
              href={url(pagina - 1)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ChevronLeft /> Anterior
            </NextLink>
          )}
          <span className="text-muted">
            Página {pagina} de {paginas}
          </span>
          {pagina < paginas && (
            <NextLink
              href={url(pagina + 1)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Siguiente <ChevronRight />
            </NextLink>
          )}
        </nav>
      )}
    </div>
  );
}
