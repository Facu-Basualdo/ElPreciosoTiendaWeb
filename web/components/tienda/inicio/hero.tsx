import { ArrowRight } from "@gravity-ui/icons";
import { buttonVariants } from "@heroui/styles";
import Image from "next/image";
import NextLink from "next/link";
import type { FotoPortada } from "@/lib/catalogo/lecturas";
import { urlPublica } from "@/lib/supabase/storage";

// Desfase vertical de cada foto: la del medio sube, las de los costados bajan.
const DESFASE = ["mt-8 sm:mt-14", "", "mt-14 sm:mt-24"];

/**
 * Portada de /nosotros: el texto de la marca y tres fotos reales de productos elegidos
 * a mano (SITIO.portadaNosotros), no una imagen de stock. Fondo marfil, sin video.
 * Con menos de tres fotos queda sólo el texto.
 */
export function Hero({ fotos }: { fotos: FotoPortada[] }) {
  const conFotos = fotos.length >= 3;

  return (
    <section className="relative isolate overflow-hidden">
      <div
        className={`contenedor grid items-center gap-10 py-12 sm:py-16 lg:gap-16 lg:py-20 ${
          conFotos ? "lg:grid-cols-[1.1fr_1fr]" : ""
        }`}
      >
        <div className="flex flex-col items-start gap-6">
          <p className="antetitulo text-celeste-oscuro">Escarapelas y prendedores artesanales</p>
          <h1 className="max-w-3xl font-serif text-5xl leading-[1.05] tracking-tight sm:text-7xl">
            Llevá la patria,
            <br />
            <em className="bg-[linear-gradient(transparent_62%,var(--color-dorado)_62%,var(--color-dorado)_92%,transparent_92%)] box-decoration-clone">
              cerca del corazón.
            </em>
          </h1>
          <p className="max-w-xl text-base text-muted sm:text-lg">
            Hechos a mano, con tiempo, para los actos y las fechas patrias. Pensados para durar.
          </p>
          <div className="flex flex-wrap gap-3">
            <NextLink href="/" className={buttonVariants({ size: "lg" })}>
              Ver catálogo
              <ArrowRight aria-hidden />
            </NextLink>
            <NextLink href="#personaliza" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Personalizá el tuyo
            </NextLink>
          </div>
        </div>

        {conFotos && (
          // Hasta lg van debajo del texto: con ancho tope para que en tablet no sean enormes.
          <div className="relative mx-auto w-full max-w-md sm:max-w-lg lg:max-w-none">
            {/* Mancha celeste detrás de las fotos: acento patrio, sólo decorativo. */}
            <div aria-hidden className="absolute inset-[8%] -z-10 rounded-full bg-celeste/30 blur-3xl" />
            <ul className="grid grid-cols-3 gap-3 sm:gap-4">
              {fotos.slice(0, 3).map((p, i) => (
                <li key={p.slug} className={DESFASE[i]}>
                  <NextLink
                    href={`/p/${p.slug}`}
                    aria-label={p.nombre}
                    className="group relative block aspect-[9/16] overflow-hidden rounded-tarjeta bg-surface-secondary shadow-[0_18px_40px_-18px_rgb(14_27_44/0.45)]"
                  >
                    <Image
                      src={urlPublica(p.path)}
                      alt={p.alt}
                      fill
                      priority
                      sizes="(min-width: 1024px) 16vw, 32vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                    />
                  </NextLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
