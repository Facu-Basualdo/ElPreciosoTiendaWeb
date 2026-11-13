import Image from "next/image";
import NextLink from "next/link";
import { formatearPrecio } from "@/lib/formato";
import { urlPublica } from "@/lib/supabase/storage";
import { SwitchVisible } from "./switch-visible";

export type FilaProducto = {
  id: string;
  nombre: string;
  imagen: string | null;
  categoria: string | null;
  precio: number;
  publicado: boolean;
};

/**
 * Grilla de tarjetas con la foto, no tabla: la dueña reconoce los modelos por la foto, en
 * el celular una tabla no entraba y en la computadora dejaba media pantalla vacía. Toda la
 * tarjeta abre el producto (link estirado con after:inset-0); el switch "Visible" va por
 * encima. Ver claude/web/dashboard.md#productos
 */
export function ListaProductos({ productos }: { productos: FilaProducto[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))]">
      {productos.map((p) => (
        <li
          key={p.id}
          className={`relative flex flex-col overflow-hidden rounded-tarjeta border bg-surface transition-shadow hover:shadow-[0_10px_30px_-12px_rgb(14_27_44/0.25)] ${
            p.publicado ? "border-border" : "border-dashed border-muted/50"
          }`}
        >
          <div className="relative aspect-[9/16] bg-surface-secondary">
            {p.imagen && (
              <Image
                src={urlPublica(p.imagen)}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, 12rem"
                className={`object-cover ${p.publicado ? "" : "opacity-70"}`}
              />
            )}
            {!p.publicado && (
              <span className="absolute left-2 top-2 rounded-full bg-noche/80 px-2 py-0.5 text-[11px] font-medium text-marfil">Oculto</span>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-1 p-3">
            <NextLink
              href={`/admin/productos/${p.id}`}
              className="line-clamp-2 text-sm font-medium leading-snug outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-focus"
            >
              {p.nombre}
            </NextLink>
            <span className="truncate text-xs text-muted">{p.categoria ?? "Sin categoría"}</span>
            <div className="mt-auto flex items-center justify-between gap-2 pt-2">
              {p.precio > 0 ? (
                <span className="text-sm font-semibold tabular-nums">{formatearPrecio(p.precio)}</span>
              ) : (
                // Sin precio la tienda muestra "Precio a consultar" y no deja sumarlo al carrito.
                <span className="rounded-full bg-dorado/30 px-2 py-0.5 text-xs font-medium">Sin precio</span>
              )}
              {/* relative + z-10: por encima del link estirado, así tocar el switch no abre el producto. */}
              <div className="relative z-10">
                <SwitchVisible id={p.id} publicado={p.publicado} nombre={p.nombre} />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
