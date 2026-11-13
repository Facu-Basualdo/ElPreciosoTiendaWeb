"use client";

import { ShoppingCart } from "@gravity-ui/icons";
import NextLink from "next/link";
import { cantidadTotal, useCarrito } from "@/lib/carrito/almacen";

// Ícono del encabezado con la cantidad de unidades. La cantidad sale del carrito
// local (sin red); los precios sólo los muestra /carrito, cotizados en la base.
export function AccesoCarrito() {
  const cantidad = cantidadTotal(useCarrito());

  return (
    <NextLink
      href="/carrito"
      aria-label={cantidad ? `Carrito, ${cantidad} ${cantidad === 1 ? "unidad" : "unidades"}` : "Carrito vacío"}
      className="relative inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-[var(--radius)] px-2 transition-colors hover:bg-default md:px-3"
    >
      <ShoppingCart className="size-5" />
      {/* En la computadora dice "Carrito"; en el celular, sólo el ícono. */}
      <span className="hidden text-sm font-medium md:inline">Carrito</span>
      {cantidad > 0 && (
        <span className="absolute -top-0.5 left-6 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold tabular-nums text-accent-foreground">
          {cantidad > 99 ? "99+" : cantidad}
        </span>
      )}
    </NextLink>
  );
}
