import NextLink from "next/link";
import { Suspense } from "react";
import { AccesoCarrito } from "@/components/carrito/acceso-carrito";
import { Logo } from "@/components/logo";
import { obtenerCategorias } from "@/lib/catalogo/lecturas";
import { SITIO } from "@/lib/sitio";
import { Buscador, BuscadorMovil } from "./buscador";
import { MenuMovil } from "./menu-movil";

// Encabezado liviano de una fila, marfil translúcido. En mobile: menú · logo · lupa ·
// carrito (siempre visible). En escritorio suma los links y el buscador.
export async function Encabezado() {
  const categorias = await obtenerCategorias();
  const enlaces = [
    { href: "/catalogo", texto: "Catálogo" },
    ...categorias.map((c) => ({ href: `/catalogo?cat=${c.slug}`, texto: c.nombre })),
    ...(SITIO.ventasAvanzadas
      ? [
          { href: "/combos", texto: "Combos" },
          { href: "/ofertas", texto: "Ofertas" },
        ]
      : []),
    { href: "/#personaliza", texto: "Personalizá" },
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
