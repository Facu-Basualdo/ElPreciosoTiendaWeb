"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

export type Enlace = { href: string; texto: string };

// La sección actual queda marcada (subrayado dorado + aria-current). Sólo las rutas: las
// anclas de /nosotros (#personaliza…) no se marcan. usePathname va en Suspense para no
// volver dinámico el layout; el fallback es la misma lista sin marcar.
export function NavPrincipal({ enlaces }: { enlaces: Enlace[] }) {
  return (
    <nav aria-label="Secciones" className="hidden items-center gap-1 text-sm lg:flex">
      <Suspense fallback={<Lista enlaces={enlaces} actual="" />}>
        <ListaConRuta enlaces={enlaces} />
      </Suspense>
    </nav>
  );
}

function ListaConRuta({ enlaces }: { enlaces: Enlace[] }) {
  return <Lista enlaces={enlaces} actual={usePathname()} />;
}

function Lista({ enlaces, actual }: { enlaces: Enlace[]; actual: string }) {
  return enlaces.map((e) => {
    const activo = !e.href.includes("#") && e.href === actual;
    return (
      <NextLink
        key={e.href}
        href={e.href}
        aria-current={activo ? "page" : undefined}
        className={`relative rounded-lg px-3 py-2 transition-colors after:absolute after:inset-x-3 after:bottom-0.5 after:h-0.5 after:rounded-full after:transition-colors ${
          activo ? "font-medium text-foreground after:bg-dorado" : "text-muted after:bg-transparent hover:text-foreground hover:after:bg-dorado/50"
        }`}
      >
        {e.texto}
      </NextLink>
    );
  });
}
