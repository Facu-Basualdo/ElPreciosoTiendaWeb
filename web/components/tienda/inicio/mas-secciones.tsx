import { ArrowRight } from "@gravity-ui/icons";
import { Disclosure } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import Image from "next/image";
import NextLink from "next/link";
import type { TarjetaProducto } from "@/lib/catalogo/lecturas";
import { SITIO } from "@/lib/sitio";
import { urlPublica } from "@/lib/supabase/storage";
import { TituloSeccion } from "./titulo-seccion";

/** Fotos reales de los últimos modelos publicados: la página de presentación muestra el trabajo. */
export function Trabajos({ productos }: { productos: TarjetaProducto[] }) {
  const conFoto = productos.filter((p) => p.imagen);
  if (!conFoto.length) return null;
  return (
    <section id="trabajos" aria-labelledby="titulo-trabajos" className="contenedor flex scroll-mt-20 flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <TituloSeccion id="titulo-trabajos" antetitulo="Nuestros trabajos" titulo="Recién salidos de la mesa de trabajo" />
        <NextLink href="/" className={buttonVariants({ variant: "outline" })}>
          Ver todo el catálogo
          <ArrowRight aria-hidden />
        </NextLink>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 xl:grid-cols-8">
        {conFoto.slice(0, 8).map((p) => (
          <li key={p.id}>
            <NextLink href={`/p/${p.slug}`} className="group block overflow-hidden rounded-tarjeta bg-surface-secondary">
              <span className="relative block aspect-[9/16]">
                <Image
                  src={urlPublica(p.imagen!.path)}
                  alt={p.nombre}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 12.5vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                />
              </span>
            </NextLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Sólo lo que la tienda ya sabe: no se inventan medios de pago ni plazos.
function preguntas() {
  return [
    {
      p: "¿Hacen envíos?",
      r: `Sí, a todo el país. También podés retirarlo en ${SITIO.ciudad.split(",")[0]}. La forma y el costo del envío los coordinamos por WhatsApp.`,
    },
    {
      p: "¿Cómo pago?",
      r: "Al enviar el pedido desde la tienda no se cobra nada: te respondemos por WhatsApp para confirmarlo y ahí coordinamos el pago.",
    },
    {
      p: "¿Cuánto tarda?",
      r: SITIO.demoraDias
        ? `Cada pieza se hace a pedido: suele estar lista en ${SITIO.demoraDias} días. Para muchas unidades, consultanos.`
        : "Cada pieza se hace a pedido, así que depende del modelo y la cantidad. Te confirmamos la fecha al responder tu pedido.",
    },
    {
      p: "¿Hacen pedidos para colegios o en cantidad?",
      r: "Sí. Mirá los Packs del catálogo o escribinos con la cantidad y la fecha del acto, y te armamos el pedido.",
    },
    {
      p: "¿Puedo pedir uno personalizado?",
      r: "Sí: con un nombre, el escudo de tu equipo, los colores o el dije que quieras. Escribinos y lo armamos juntos.",
    },
  ];
}

export function Preguntas() {
  return (
    <section id="preguntas" aria-labelledby="titulo-preguntas" className="contenedor grid scroll-mt-20 gap-8 lg:grid-cols-[1fr_2fr]">
      <TituloSeccion id="titulo-preguntas" antetitulo="Preguntas frecuentes" titulo="Lo que más nos consultan" />
      <div className="flex flex-col divide-y divide-border rounded-tarjeta border border-border bg-surface">
        {preguntas().map(({ p, r }) => (
          <Disclosure key={p} className="px-5">
            <Disclosure.Heading>
              <Disclosure.Trigger className="flex w-full items-center justify-between gap-4 py-4 text-left font-serif text-lg">
                {p}
                <Disclosure.Indicator />
              </Disclosure.Trigger>
            </Disclosure.Heading>
            <Disclosure.Content>
              <Disclosure.Body className="pb-4 text-muted">{r}</Disclosure.Body>
            </Disclosure.Content>
          </Disclosure>
        ))}
      </div>
    </section>
  );
}
