import { Chip } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import Image from "next/image";
import NextLink from "next/link";
import { BotonAgregar } from "@/components/carrito/boton-agregar";
import type { TarjetaProducto as Datos } from "@/lib/catalogo/lecturas";
import { urlPublica } from "@/lib/supabase/storage";
import { Precio } from "./precio";

// Una sola variante de `sizes` para las grillas: cada combinación distinta consume
// cupo de optimización de Vercel. Ver claude/web/imagenes.md
// La grilla usa columnas de 15rem como mínimo (auto-fill): en escritorio una tarjeta
// ronda los 240–320 px. Pedir 25vw bajaba fotos de casi 500 px en un monitor ancho.
export const SIZES_TARJETA = "(max-width: 640px) 50vw, 20rem";

/** Tarjeta del catálogo: foto 9:16 arriba, nombre, precio y la acción. */
export function TarjetaProducto({ producto, prioridad = false }: { producto: Datos; prioridad?: boolean }) {
  const oferta = producto.precioAnterior != null && producto.precioAnterior > producto.precioDesde;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-tarjeta border border-border bg-surface transition-shadow hover:shadow-[0_10px_30px_-12px_rgb(14_27_44/0.25)]">
      <NextLink
        href={`/p/${producto.slug}`}
        tabIndex={-1}
        aria-hidden
        className="relative block aspect-[9/16] w-full shrink-0 bg-surface-secondary"
      >
        {producto.imagen ? (
          <Image
            src={urlPublica(producto.imagen.path)}
            alt=""
            fill
            sizes={SIZES_TARJETA}
            priority={prioridad}
            className={`object-cover ${producto.disponible ? "" : "opacity-60"}`}
          />
        ) : null}
        <div className="absolute left-2 top-2 flex gap-1">
          {!producto.disponible && (
            <Chip size="sm" variant="secondary">
              Sin stock
            </Chip>
          )}
          {producto.disponible && oferta && (
            <Chip size="sm" variant="primary">
              Oferta
            </Chip>
          )}
          {producto.disponible && producto.promo && (
            <Chip size="sm" variant="primary">
              {producto.promo}
            </Chip>
          )}
        </div>
      </NextLink>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3 sm:p-4">
        {producto.marca && (
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{producto.marca}</p>
        )}
        <h3 className="line-clamp-2 font-serif text-base leading-snug">
          <NextLink href={`/p/${producto.slug}`} className="outline-none hover:underline hover:underline-offset-4 focus-visible:underline">
            {producto.nombre}
          </NextLink>
        </h3>
        <div className="mt-auto flex flex-col gap-3 pt-1">
          <Precio valor={producto.precioDesde} anterior={producto.precioAnterior} desde={producto.precioVaria} />
          <AccionTarjeta producto={producto} />
        </div>
      </div>
    </article>
  );
}

// Variante única con stock → al carrito directo. Con varias bases → a la ficha a
// elegir. Sin stock → deshabilitado.
function AccionTarjeta({ producto }: { producto: Datos }) {
  if (!producto.disponible) {
    return (
      <span aria-disabled className={`${buttonVariants({ variant: "secondary", size: "sm", fullWidth: true })} pointer-events-none opacity-60`}>
        Sin stock
      </span>
    );
  }
  if (producto.varianteId) {
    return <BotonAgregar varianteId={producto.varianteId} nombre={producto.nombre} size="sm" />;
  }
  return (
    <NextLink href={`/p/${producto.slug}`} className={buttonVariants({ variant: "outline", size: "sm", fullWidth: true })}>
      Elegir base
    </NextLink>
  );
}

export function GrillaProductos({ productos, prioridad = 0 }: { productos: Datos[]; prioridad?: number }) {
  return (
    // Siempre grilla: la vista en lista no tenía sentido con fotos 9:16 (se sacó).
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] sm:gap-4">
      {productos.map((p, i) => (
        <li key={p.id}>
          <TarjetaProducto producto={p} prioridad={i < prioridad} />
        </li>
      ))}
    </ul>
  );
}
