import { ChevronLeft, Xmark } from "@gravity-ui/icons";
import { buttonVariants, chipVariants } from "@heroui/styles";
import type { Metadata } from "next";
import NextLink from "next/link";
import { Suspense } from "react";
import { BotonFiltrosMovil, PanelFiltros } from "@/components/tienda/filtros/panel-filtros";
import { SelectorOrden } from "@/components/tienda/filtros/selector-orden";
import { Paginacion } from "@/components/tienda/paginacion";
import { GrillaProductos } from "@/components/tienda/tarjeta-producto";
import { EsqueletoCatalogo } from "@/components/tienda/esqueletos";
import { cantidadDeFiltros, conCambios, conGrupo, leerFiltros, urlDeFiltros, type Filtros } from "@/lib/catalogo/filtros";
import { IconoWhatsapp } from "@/components/icono-whatsapp";
import { buscarProductos, obtenerCategorias, obtenerFacetas, type Categoria } from "@/lib/catalogo/lecturas";
import { enlaceWhatsapp } from "@/lib/whatsapp";

type ParametrosBusqueda = Promise<Record<string, string | string[] | undefined>>;

// El catálogo es la portada de la tienda (`/`). /catalogo redirige acá (next.config.ts).
// Ver claude/web/catalogo.md
export async function metadataCatalogo(searchParams: ParametrosBusqueda): Promise<Metadata> {
  const filtros = leerFiltros(await searchParams);
  const categoria = buscarCategoria(await obtenerCategorias(), filtros.cat);
  const titulo = filtros.q ? `Resultados para “${filtros.q}”` : categoria?.nombre;
  // Las combinaciones de filtros no se indexan: sólo la categoría limpia.
  const indexable = !filtros.q && Object.keys(filtros.etiquetas).length === 0 && filtros.pagina === 1;
  return {
    // Sin categoría ni búsqueda queda el título por defecto del sitio.
    ...(titulo ? { title: titulo } : {}),
    alternates: { canonical: urlDeFiltros({ ...filtros, etiquetas: {}, q: null, pagina: 1 }) },
    robots: indexable ? undefined : { index: false, follow: true },
  };
}

/** searchParams se lee dentro del Suspense: así el resto del layout queda en el shell estático. */
export function PaginaCatalogo({ searchParams, banners }: { searchParams: ParametrosBusqueda; banners?: React.ReactNode }) {
  return (
    <Suspense fallback={<EsqueletoCatalogo />}>
      <Catalogo searchParams={searchParams} banners={banners} />
    </Suspense>
  );
}

function buscarCategoria(categorias: Categoria[], slug: string | null) {
  if (!slug) return null;
  for (const c of categorias) {
    if (c.slug === slug) return { ...c, padre: null as Categoria | null };
    const hija = c.hijas.find((h) => h.slug === slug);
    if (hija) return { id: "", slug: hija.slug, nombre: hija.nombre, hijas: [], padre: c };
  }
  return null;
}

async function Catalogo({ searchParams, banners }: { searchParams: ParametrosBusqueda; banners?: React.ReactNode }) {
  const filtros = leerFiltros(await searchParams);
  const [resultado, facetas, categorias] = await Promise.all([
    buscarProductos(filtros),
    obtenerFacetas(filtros),
    obtenerCategorias(),
  ]);

  const categoria = buscarCategoria(categorias, filtros.cat);
  const titulo = filtros.q ? `Resultados para “${filtros.q}”` : (categoria?.nombre ?? "Catálogo");
  // Subcategorías para navegar: las hijas de la actual, o las hermanas si es hija.
  const subcategorias = categoria?.padre ? categoria.padre.hijas : (categoria?.hijas ?? []);
  const fueraDeRango = resultado.total > 0 && filtros.pagina > resultado.paginas;
  // Los banners sólo en la portada limpia: con filtros o búsqueda, estorban.
  const portada = !filtros.cat && !filtros.q && cantidadDeFiltros(filtros) === 0 && filtros.pagina === 1;

  return (
    <div className="contenedor py-5 sm:py-8">
      {portada && banners}
      <header className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border pb-4">
          {categoria?.padre && (
            <NextLink
              href={urlDeFiltros(conCambios(filtros, { cat: categoria.padre.slug }))}
              aria-label={`Volver a ${categoria.padre.nombre}`}
              className={buttonVariants({ variant: "ghost", size: "sm", isIconOnly: true })}
            >
              <ChevronLeft />
            </NextLink>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-serif truncate text-2xl font-normal tracking-tight sm:text-3xl">{titulo}</h1>
            <p className="text-sm text-muted">
              {resultado.total} {resultado.total === 1 ? "producto" : "productos"}
            </p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <BotonFiltrosMovil facetas={facetas} filtros={filtros} categorias={categorias} />
            <div className="ml-auto flex items-center gap-2">
              <SelectorOrden filtros={filtros} />
            </div>
          </div>
        </div>
        {subcategorias.length > 0 && (
          <nav aria-label="Subcategorías" className="flex flex-wrap gap-2">
            {subcategorias.map((s) => (
              <NextLink
                key={s.slug}
                href={urlDeFiltros(conCambios(filtros, { cat: s.slug }))}
                aria-current={s.slug === filtros.cat ? "page" : undefined}
                className={buttonVariants({ size: "sm", variant: s.slug === filtros.cat ? "primary" : "outline" })}
              >
                {s.nombre}
              </NextLink>
            ))}
          </nav>
        )}
      </header>

      <div className="flex gap-6">
        <PanelFiltros facetas={facetas} filtros={filtros} categorias={categorias} />

        <section className="flex min-w-0 flex-1 flex-col gap-5" aria-label="Productos">
          <FiltrosActivos filtros={filtros} facetas={facetas} />

          {resultado.productos.length > 0 ? (
            <GrillaProductos productos={resultado.productos} prioridad={filtros.pagina === 1 ? 4 : 0} />
          ) : (
            <SinResultados filtros={filtros} fueraDeRango={fueraDeRango} portada={portada} />
          )}

          <Paginacion filtros={filtros} paginas={resultado.paginas} />
        </section>
      </div>
    </div>
  );
}

function FiltrosActivos({ filtros, facetas }: { filtros: Filtros; facetas: Awaited<ReturnType<typeof obtenerFacetas>> }) {
  const activos = Object.entries(filtros.etiquetas).flatMap(([grupo, slugs]) =>
    slugs.map((slug) => {
      const opcion = facetas.find((f) => f.slug === grupo)?.opciones.find((o) => o.slug === slug);
      return { grupo, slug, valor: opcion?.valor ?? slug };
    }),
  );
  if (!activos.length && !filtros.q) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filtros.q && (
        <NextLink href={urlDeFiltros(conCambios(filtros, { q: null }))} className={`${chipVariants({ variant: "secondary" }).base()} gap-1`}>
          “{filtros.q}” <Xmark aria-label="Quitar búsqueda" className="size-3" />
        </NextLink>
      )}
      {activos.map((a) => (
        <NextLink
          key={`${a.grupo}-${a.slug}`}
          href={urlDeFiltros(conGrupo(filtros, a.grupo, filtros.etiquetas[a.grupo].filter((s) => s !== a.slug)))}
          className={`${chipVariants({ variant: "secondary" }).base()} gap-1`}
        >
          {a.valor} <Xmark aria-label={`Quitar ${a.valor}`} className="size-3" />
        </NextLink>
      ))}
      {activos.length > 1 && (
        <NextLink href={urlDeFiltros(conCambios(filtros, { etiquetas: {} }))} className="text-sm text-muted underline underline-offset-4 hover:text-foreground">
          Limpiar filtros
        </NextLink>
      )}
    </div>
  );
}

function SinResultados({ filtros, fueraDeRango, portada }: { filtros: Filtros; fueraDeRango: boolean; portada: boolean }) {
  // Portada sin ningún producto publicado (tienda recién armada o temporada sin cargar).
  if (portada) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-tarjeta border border-dashed border-border bg-surface p-8">
        <p className="font-serif text-xl">Estamos cargando los modelos de esta temporada.</p>
        <p className="text-muted">Mientras tanto, escribinos y te mandamos fotos de lo que tenemos.</p>
        <a href={enlaceWhatsapp()} target="_blank" rel="noopener" className={buttonVariants()}>
          <IconoWhatsapp className="size-4" />
          Escribinos por WhatsApp
        </a>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start gap-4 rounded-tarjeta border border-border bg-surface p-8">
      <p className="font-medium">{fueraDeRango ? "Esta página no existe." : "No hay productos con estos filtros."}</p>
      <NextLink
        href={urlDeFiltros(fueraDeRango ? { ...filtros, pagina: 1 } : conCambios(filtros, { etiquetas: {}, q: null }))}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        {fueraDeRango ? "Ir a la primera página" : "Quitar filtros"}
      </NextLink>
    </div>
  );
}
