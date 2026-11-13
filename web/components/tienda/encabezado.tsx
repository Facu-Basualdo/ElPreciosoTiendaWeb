import { buttonVariants } from "@heroui/styles";
import NextLink from "next/link";
import { Suspense } from "react";
import { AccesoCarrito } from "@/components/carrito/acceso-carrito";
import { IconoWhatsapp } from "@/components/icono-whatsapp";
import { Logo } from "@/components/logo";
import { SITIO } from "@/lib/sitio";
import { enlaceWhatsapp } from "@/lib/whatsapp";
import { Buscador, BuscadorMovil } from "./buscador";
import { MenuMovil } from "./menu-movil";
import { NavPrincipal, type Enlace } from "./nav-principal";

const ENLACES: Enlace[] = [
  { href: "/", texto: "Catálogo" },
  ...(SITIO.ventasAvanzadas
    ? [
        { href: "/combos", texto: "Combos" },
        { href: "/ofertas", texto: "Ofertas" },
      ]
    : []),
  { href: "/nosotros", texto: "Quiénes somos" },
  { href: "/nosotros#personaliza", texto: "Personalizá" },
  { href: "/nosotros#como-comprar", texto: "Cómo comprar" },
  { href: "/nosotros#contacto", texto: "Contacto" },
];

/**
 * Franja azul noche arriba de todo (no fija: se va al bajar) con lo que da confianza, y
 * debajo el encabezado fijo marfil. En el celular: menú · logo · lupa · carrito. En la
 * computadora suma las secciones (con la actual marcada), el buscador, WhatsApp y
 * "Carrito". Las categorías no van acá: están en los filtros del catálogo.
 * Ver claude/web/tema-y-marca.md#encabezado
 */
export function Encabezado() {
  return (
    <>
      <div className="bg-encabezado text-encabezado-foreground">
        <p className="contenedor flex h-9 items-center justify-center gap-2 text-center text-xs sm:justify-between">
          <span className="hidden sm:inline">Hecho a mano en {SITIO.ciudad}</span>
          <span className="sm:hidden">Hecho a mano · Envíos a todo el país</span>
          <span className="hidden text-white/80 sm:inline">
            Envíos a todo el país · Retiro en {SITIO.ciudad.split(",")[0]}
          </span>
          <a
            href={enlaceWhatsapp()}
            target="_blank"
            rel="noopener"
            className="hidden items-center gap-1.5 text-dorado hover:underline sm:inline-flex"
          >
            <IconoWhatsapp className="size-3.5" />
            Pedidos por WhatsApp
          </a>
        </p>
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="contenedor flex h-16 items-center gap-2 lg:gap-6">
          <MenuMovil enlaces={ENLACES} />
          <NextLink href="/" aria-label="Inicio" className="shrink-0">
            <Logo className="text-lg sm:text-xl" />
          </NextLink>

          <NavPrincipal enlaces={ENLACES} />

          {/* El buscador lee searchParams: va en Suspense para no volver dinámico el layout. */}
          <div className="ml-auto hidden w-full max-w-sm md:block xl:max-w-md">
            <Suspense fallback={<div className="h-10" />}>
              <Buscador />
            </Suspense>
          </div>

          <div className="ml-auto flex items-center gap-1 md:ml-0 md:gap-2">
            <Suspense fallback={null}>
              <BuscadorMovil />
            </Suspense>
            <a
              href={enlaceWhatsapp()}
              target="_blank"
              rel="noopener"
              className={`${buttonVariants({ variant: "outline", size: "sm" })} hidden xl:inline-flex`}
            >
              <IconoWhatsapp className="size-4" />
              WhatsApp
            </a>
            <AccesoCarrito />
          </div>
        </div>
      </header>
    </>
  );
}
