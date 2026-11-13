import { buttonVariants } from "@heroui/styles";
import Image from "next/image";
import NextLink from "next/link";
import { IconoWhatsapp } from "@/components/icono-whatsapp";
import { CarruselBanners } from "@/components/tienda/carrusel-banners";
import { CarruselProductos } from "@/components/tienda/carrusel-productos";
import { Hero } from "@/components/tienda/inicio/hero";
import { Beneficios, ComoComprar, Contacto, Personaliza, Problema, Sobre } from "@/components/tienda/inicio/secciones";
import { TituloSeccion } from "@/components/tienda/inicio/titulo-seccion";
import { TarjetaCombo } from "@/components/tienda/tarjeta-combo";
import { TarjetaProducto } from "@/components/tienda/tarjeta-producto";
import { buscarCombos } from "@/lib/catalogo/combos";
import {
  obtenerBanners,
  obtenerCategorias,
  obtenerMosaicoCategorias,
  obtenerOfertas,
  obtenerRecientes,
  obtenerValoresGrupo,
} from "@/lib/catalogo/lecturas";
import { SITIO } from "@/lib/sitio";
import { urlPublica } from "@/lib/supabase/storage";
import { enlaceWhatsapp } from "@/lib/whatsapp";

// La home es la landing de El Precioso hecha con datos de la base: hero con la bandera,
// últimos ingresos, catálogo por categoría, personalización, sobre nosotros y contacto.
// Las reseñas de la landing no eran reales: no se publican. Ver docs/plan-el-precioso.md
export default async function Inicio() {
  const [banners, recientes, categorias, mosaico, bases, combos, ofertas] = await Promise.all([
    obtenerBanners(),
    obtenerRecientes(10),
    obtenerCategorias(),
    obtenerMosaicoCategorias(),
    obtenerValoresGrupo("base"),
    SITIO.ventasAvanzadas ? buscarCombos(true, 8) : null,
    SITIO.ventasAvanzadas ? obtenerOfertas(12) : null,
  ]);

  return (
    <div className="flex flex-col gap-16 pb-4 sm:gap-24">
      <div>
        <Hero />
        {banners.length > 0 && (
          <div className="contenedor pt-8">
            <CarruselBanners banners={banners} />
          </div>
        )}
        <Problema />
        <Beneficios />
      </div>

      {recientes.length > 0 && (
        <div className="contenedor">
          <CarruselProductos antetitulo="Últimos ingresos" titulo="Recién salidos de la mesa de trabajo">
            {recientes.map((p) => (
              <TarjetaProducto key={p.id} producto={p} />
            ))}
          </CarruselProductos>
        </div>
      )}

      <section id="catalogo" aria-labelledby="titulo-catalogo" className="contenedor flex scroll-mt-16 flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <TituloSeccion id="titulo-catalogo" antetitulo="Catálogo" titulo="Toda la colección" />
          {recientes.length > 0 && (
            <NextLink href="/catalogo" className={buttonVariants({ variant: "outline" })}>
              Ver todos los modelos
            </NextLink>
          )}
        </div>

        {recientes.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded-tarjeta border border-dashed border-border bg-surface p-8">
            <p className="font-serif text-xl">Estamos cargando los modelos de esta temporada.</p>
            <p className="text-muted">Mientras tanto, escribinos y te mandamos fotos de lo que tenemos.</p>
            <a href={enlaceWhatsapp()} target="_blank" rel="noopener" className={buttonVariants()}>
              <IconoWhatsapp className="size-4" />
              Escribinos por WhatsApp
            </a>
          </div>
        ) : mosaico.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {mosaico.map((c) => (
              <li key={c.slug}>
                <NextLink
                  href={`/catalogo?cat=${c.slug}`}
                  className="group relative block aspect-[3/4] overflow-hidden rounded-tarjeta bg-surface-secondary"
                >
                  {c.imagen && (
                    <Image
                      src={urlPublica(c.imagen)}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                    />
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-noche/80 to-transparent px-4 pb-4 pt-12 font-serif text-xl text-marfil">
                    {c.nombre}
                  </span>
                </NextLink>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {categorias.map((c) => (
              <li key={c.id}>
                <NextLink href={`/catalogo?cat=${c.slug}`} className={buttonVariants({ variant: "secondary" })}>
                  {c.nombre}
                </NextLink>
              </li>
            ))}
          </ul>
        )}
      </section>

      {combos && combos.combos.length > 0 && (
        <div className="contenedor">
          <CarruselProductos antetitulo="Combos" titulo="Llevá más, pagá menos">
            {combos.combos.map((c) => (
              <TarjetaCombo key={c.id} combo={c} />
            ))}
          </CarruselProductos>
        </div>
      )}

      {ofertas && ofertas.productos.length > 0 && (
        <div className="contenedor">
          <CarruselProductos antetitulo="Ofertas" titulo="Precios rebajados">
            {ofertas.productos.map((p) => (
              <TarjetaProducto key={p.id} producto={p} />
            ))}
          </CarruselProductos>
        </div>
      )}

      <ComoComprar />
      <Personaliza bases={bases} />
      <Sobre />
      <Contacto />
    </div>
  );
}
