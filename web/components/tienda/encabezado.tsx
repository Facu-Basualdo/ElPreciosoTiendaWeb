import NextLink from "next/link";
import { Suspense } from "react";
import { AccesoCarrito } from "@/components/carrito/acceso-carrito";
import { Logo } from "@/components/logo";
import { SITIO } from "@/lib/sitio";
import { Buscador, BuscadorMovil } from "./buscador";
import { MenuMovil } from "./menu-movil";

// Encabezado liviano de una fila, marfil translúcido. En mobile: menú · logo · lupa ·
// carrito (siempre visible). En escritorio suma los links y el buscador. Las categorías
// no van acá: están en los filtros del catálogo. Ver claude/web/catalogo.md
export function Encabezado() {
  const enlaces = [
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

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="contenedor flex h-16 items-center gap-2 lg:gap-8">
        <MenuMovil enlaces={enlaces} />
        <NextLink href="/" aria-label="Inicio" className="shrink-0">
          <Logo className="text-lg sm:text-xl" />
        </NextLink>

        <nav aria-label="Secciones" className="hidden items-center gap-6 text-sm lg:flex">
          {enlaces.map((e) => (
            <NextLink key={e.href} href={e.href} className="text-muted transition-colors hover:text-foreground">
              {e.texto}
            </NextLink>
          ))}
        </nav>

        {/* El buscador lee searchParams: va en Suspense para no volver dinámico el layout. */}
        <div className="ml-auto hidden w-full max-w-xs md:block">
          <Suspense fallback={<div className="h-10" />}>
            <Buscador />
          </Suspense>
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Suspense fallback={null}>
            <BuscadorMovil />
          </Suspense>
          <AccesoCarrito />
        </div>
      </div>
    </header>
  );
}
