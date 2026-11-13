import { ChevronRight, Folder, Key, LayoutHeaderCells, Percent, Persons, Picture, Tag, Tags } from "@gravity-ui/icons";
import type { Metadata } from "next";
import NextLink from "next/link";
import { SITIO } from "@/lib/sitio";

export const metadata: Metadata = { title: "Ajustes" };

// Lo que se toca poco, fuera del menú principal. La guardia de admin la pone el layout.
const OPCIONES = [
  { href: "/admin/categorias", titulo: "Categorías", texto: "Escarapelas, prendedores, packs… y su orden en la tienda.", icono: Folder },
  { href: "/admin/etiquetas", titulo: "Etiquetas", texto: "Bases, fechas patrias, dijes y colores: los filtros del catálogo.", icono: Tags },
  { href: "/admin/banners", titulo: "Banners", texto: "Imágenes con título y botón debajo del video de la portada.", icono: Picture },
  { href: "/admin/usuarios", titulo: "Usuarios", texto: "Quiénes pueden entrar a este panel.", icono: Persons },
  { href: "/admin/ajustes/contrasena", titulo: "Mi contraseña", texto: "Cambiá la contraseña con la que entrás al panel.", icono: Key },
  ...(SITIO.ventasAvanzadas
    ? [
        { href: "/admin/promociones", titulo: "Promociones", texto: "Descuentos automáticos, 3x2, 2da unidad.", icono: Percent },
        { href: "/admin/combos", titulo: "Combos", texto: "Varios productos a un precio.", icono: LayoutHeaderCells },
        { href: "/admin/cupones", titulo: "Cupones", texto: "Códigos de descuento.", icono: Tag },
      ]
    : []),
];

export default function PaginaAjustes() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>
      <ul className="grid gap-3 sm:grid-cols-2">
        {OPCIONES.map(({ href, titulo, texto, icono: Icono }) => (
          <li key={href}>
            <NextLink
              href={href}
              className="flex items-center gap-4 rounded-tarjeta border border-border bg-surface p-5 transition-colors hover:bg-surface-secondary"
            >
              <Icono aria-hidden className="size-6 shrink-0 text-celeste-oscuro" />
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="font-medium">{titulo}</span>
                <span className="text-sm text-muted">{texto}</span>
              </span>
              <ChevronRight aria-hidden className="size-4 text-muted" />
            </NextLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
