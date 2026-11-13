import { buttonVariants } from "@heroui/styles";
import Image from "next/image";
import { Huella } from "@/components/huella";
import { IconoWhatsapp } from "@/components/icono-whatsapp";
import { SITIO } from "@/lib/sitio";
import { enlaceWhatsapp } from "@/lib/whatsapp";
import mesaDeTrabajo from "@/public/marca/mesa-de-trabajo.webp";
import { TituloSeccion } from "./titulo-seccion";

// Secciones fijas de la home, con los textos de la landing original de El Precioso.

export function Problema() {
  return (
    <section className="contenedor flex max-w-3xl flex-col items-center gap-6 py-16 text-center sm:py-24">
      <span aria-hidden className="h-1 w-12 rounded-full bg-dorado" />
      <p className="font-serif text-2xl italic leading-snug sm:text-3xl">
        Cada Mayo, la misma escarapela apurada. La de siempre, la del kiosco, la que se rompe antes de llegar al acto.
      </p>
    </section>
  );
}

const BENEFICIOS = [
  {
    titulo: "Hechas a mano",
    texto: "Cada pieza se arma una por una, no sale de una máquina.",
    icono: (
      <>
        <path d="M9 24c0-3 2-5 4-5h6c2 0 4 2 4 5" />
        <path d="M12 19c0-2 1-3 1-5 0-3-2-5-4-5s-3 2-3 4 1 3 1 5" />
        <path d="M20 19c0-2-1-3-1-5 0-3 2-5 4-5s3 2 3 4-1 3-1 5" />
      </>
    ),
  },
  {
    titulo: "Materiales que aguantan",
    texto: "Cintas, broches y detalles pensados para usarse muchas veces.",
    icono: (
      <>
        <path d="M16 4l10 5v8c0 6-4 10-10 11C10 27 6 23 6 17V9l10-5z" />
        <path d="M11 16l3.5 3.5L21 13" />
      </>
    ),
  },
  {
    titulo: "Diseños únicos",
    texto: "Modelos que no vas a encontrar en otro lado.",
    icono: (
      <>
        <circle cx="16" cy="16" r="6" />
        <path d="M16 4v3M16 25v3M4 16h3M25 16h3M7.5 7.5l2 2M22.5 22.5l2 2M7.5 24.5l2-2M22.5 9.5l2-2" />
      </>
    ),
  },
];

export function Beneficios() {
  return (
    <section aria-label={`Por qué ${SITIO.nombre}`} className="contenedor">
      <ul className="grid gap-4 sm:grid-cols-3">
        {BENEFICIOS.map((b) => (
          <li key={b.titulo} className="flex flex-col gap-3 rounded-tarjeta border border-border bg-surface p-6">
            <svg
              viewBox="0 0 32 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className="size-9 text-celeste-oscuro"
            >
              {b.icono}
            </svg>
            <h3 className="font-serif text-xl">{b.titulo}</h3>
            <p className="text-sm text-muted">{b.texto}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

const PASOS = [
  { titulo: "Elegí tus modelos", texto: "Sumalos al carrito con la base que prefieras. El total se calcula solo." },
  { titulo: "Mandanos el pedido", texto: "Con un toque se arma el mensaje de WhatsApp con todo lo que elegiste." },
  { titulo: "Coordinamos", texto: "Te confirmamos el pago y el retiro en Resistencia o el envío a todo el país." },
];

export function ComoComprar() {
  return (
    <section id="como-comprar" aria-labelledby="titulo-como-comprar" className="contenedor flex scroll-mt-20 flex-col gap-8">
      <TituloSeccion id="titulo-como-comprar" antetitulo="Cómo comprar" titulo="Tres pasos y listo" />
      <ol className="grid gap-4 sm:grid-cols-3">
        {PASOS.map((p, i) => (
          <li key={p.titulo} className="flex gap-4 rounded-tarjeta bg-surface-secondary p-6">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-dorado font-serif text-lg text-noche">
              {i + 1}
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="font-medium">{p.titulo}</h3>
              <p className="text-sm text-muted">{p.texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Personaliza({ bases }: { bases: string[] }) {
  return (
    <section id="personaliza" aria-labelledby="titulo-personaliza" className="scroll-mt-16 bg-encabezado text-encabezado-foreground">
      <div className="contenedor flex flex-col gap-12 py-20 sm:py-28">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <TituloSeccion id="titulo-personaliza" antetitulo="Personalizá el tuyo" titulo="Tu prendedor, a tu manera" centrado oscuro />
          <p className="text-white/70">
            La pasión por lo nuestro unida a la creatividad: prendedores únicos para todas las edades. Más que un accesorio,
            cada pieza es una expresión de identidad y orgullo.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {bases.length > 0 && (
            <div className="flex flex-col gap-4 rounded-tarjeta border border-white/10 p-6">
              <p className="antetitulo text-dorado">Bases disponibles</p>
              <ul className="flex flex-col gap-2 text-sm">
                {bases.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-celeste" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-col gap-4 rounded-tarjeta border border-white/10 p-6 text-sm">
            <p className="antetitulo text-dorado">Materiales</p>
            <div>
              <p className="font-medium">Cintas</p>
              <p className="text-white/70">Distintos colores y texturas a elección.</p>
            </div>
            <div>
              <p className="font-medium">Dijes</p>
              <p className="text-white/70">
                Estrella, guitarra, pava, sol, Malvinas, monedas del Cabildo y la Casa de Tucumán, corazón, paloma con laurel,
                pelota de fútbol y más.
              </p>
            </div>
            <div>
              <p className="font-medium">Cuentas y mostacillas</p>
              <p className="text-white/70">Para ese toque final de brillo y color.</p>
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-tarjeta bg-dorado p-6 text-noche">
            <p className="antetitulo">Hacelo único</p>
            <ul className="flex flex-col gap-2 font-serif text-lg leading-snug">
              <li>Nombre personalizado, para vos o para regalar.</li>
              <li>Dije con el escudo de tu equipo de fútbol.</li>
            </ul>
            <a
              href={enlaceWhatsapp(`¡Hola! Quiero personalizar un prendedor de ${SITIO.nombre}.`)}
              target="_blank"
              rel="noopener"
              className={`${buttonVariants({ variant: "primary" })} mt-auto bg-noche text-marfil hover:bg-noche/90`}
            >
              <IconoWhatsapp className="size-4" />
              Consultanos y armamos el tuyo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Sobre() {
  return (
    <section id="sobre" aria-labelledby="titulo-sobre" className="contenedor grid scroll-mt-16 items-center gap-10 md:grid-cols-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-tarjeta">
        <Image
          src={mesaDeTrabajo}
          alt="La mesa de trabajo: cintas, dijes, mostacillas y pinzas"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          placeholder="blur"
          className="object-cover"
        />
        <span className="antetitulo absolute left-4 top-4 rounded-full bg-noche/70 px-3 py-1 text-marfil backdrop-blur">
          Mesa de trabajo
        </span>
      </div>
      <div className="flex flex-col gap-5">
        <TituloSeccion id="titulo-sobre" antetitulo="Sobre nosotros" titulo="Hecho con tiempo, en Chaco" />
        <p className="text-muted">
          {SITIO.nombre} nació en {SITIO.ciudad}, en una mesa de comedor, cortando cintas para los actos de la escuela.
        </p>
        <div className="flex gap-4 rounded-tarjeta bg-celeste/15 p-5">
          <Huella className="size-8 shrink-0 text-celeste-oscuro" />
          <div className="flex flex-col gap-1">
            <p className="font-serif text-lg">¿Por qué se llama &ldquo;{SITIO.nombre}&rdquo;?</p>
            <p className="text-sm text-muted">
              La respuesta es simple y llena de cariño: mi <strong className="text-foreground">hijo perruno</strong>, mi fiel
              amigo, fue y será el regalo más precioso de mi vida.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Contacto() {
  return (
    <section id="contacto" aria-labelledby="titulo-contacto" className="contenedor scroll-mt-20">
      <div className="relative isolate overflow-hidden rounded-tarjeta border border-border bg-surface px-6 py-14 text-center sm:py-20">
        {/* Manchas de acuarela celeste y dorada, como en la plantilla de las fotos. */}
        <span aria-hidden className="absolute -left-16 -top-20 -z-10 size-72 rounded-full bg-celeste/35 blur-3xl" />
        <span aria-hidden className="absolute -bottom-24 -right-10 -z-10 size-72 rounded-full bg-dorado/40 blur-3xl" />
        <div className="mx-auto flex max-w-xl flex-col items-center gap-5">
          <h2 id="titulo-contacto" className="font-serif text-3xl tracking-tight sm:text-4xl">
            ¿Te gustó algún modelo?
          </h2>
          <p className="text-muted">Escribinos por WhatsApp y coordinamos. Hacemos envíos a todo el país.</p>
          <a
            href={enlaceWhatsapp(`¡Hola! Vi el catálogo de ${SITIO.nombre} y me gustaría hacer un pedido.`)}
            target="_blank"
            rel="noopener"
            className={buttonVariants({ size: "lg" })}
          >
            <IconoWhatsapp className="size-5" />
            Escribinos por WhatsApp
          </a>
          <p className="text-xs text-muted">Respondemos de {SITIO.horario.toLowerCase()}.</p>
        </div>
      </div>
    </section>
  );
}
