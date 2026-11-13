import { ArrowLeft, ArrowUpRightFromSquare } from "@gravity-ui/icons";
import { Chip, Disclosure, Skeleton } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import type { Metadata } from "next";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BorrarProducto } from "@/components/admin/productos/borrar-producto";
import { ProveedorCategoria } from "@/components/admin/productos/categoria-producto";
import { EditorDescripcion } from "@/components/admin/editor-descripcion";
import { EditorEtiquetas } from "@/components/admin/productos/editor-etiquetas";
import { EditorVariantes } from "@/components/admin/productos/editor-variantes";
import { FormularioDatos } from "@/components/admin/productos/formulario-datos";
import { HistorialStock } from "@/components/admin/productos/historial-stock";
import { GaleriaAdmin } from "@/components/admin/galeria-admin";
import { requerirAdmin } from "@/lib/auth";
import {
  obtenerCatalogosAdmin,
  obtenerProductoAdmin,
} from "@/lib/admin/productos";
import {
  actualizarAlt,
  borrarImagen,
  guardarDescripcion,
  registrarImagen,
  reordenarImagenes,
} from "../acciones";

export const metadata: Metadata = { title: "Editar producto" };

// Shell estático + todo lo que lee la sesión/params en su propio Suspense.
// Ver claude/web/dashboard.md#páginas-del-panel
export default function PaginaEditarProducto(
  props: PageProps<"/admin/productos/[id]">,
) {
  return (
    <div className="flex flex-col gap-5">
      <NextLink
        href="/admin/productos"
        className="flex items-center gap-2 self-start text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Productos
      </NextLink>
      <Suspense
        fallback={
          <div className="flex flex-col gap-5">
            <Skeleton className="h-10 w-72 rounded-lg" />
            <Skeleton className="h-80 rounded-tarjeta" />
          </div>
        }
      >
        <Edicion params={props.params} />
      </Suspense>
    </div>
  );
}

async function Edicion({
  params,
}: {
  params: PageProps<"/admin/productos/[id]">["params"];
}) {
  const { id } = await params;
  const { supabase } = await requerirAdmin();
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const [producto, catalogos] = await Promise.all([
    obtenerProductoAdmin(supabase, id),
    obtenerCatalogosAdmin(supabase),
  ]);
  if (!producto) notFound();

  // "M / Negro" por variante, en el orden de los grupos (para el historial de stock).
  const etiquetas = new Map(catalogos.grupos.flatMap((g) => g.etiquetas.map((e) => [e.id, { valor: e.valor, orden: g.orden }] as const)));
  const nombres = new Map(
    producto.variantes.map((v) => {
      const valores = v.etiquetas.flatMap((id) => etiquetas.get(id) ?? []).sort((a, b) => a.orden - b.orden);
      return [v.id, valores.length ? valores.map((e) => e.valor).join(" / ") : "Variante única"];
    }),
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {producto.nombre}
          </h1>
          <Chip
            size="sm"
            variant={producto.publicado ? "primary" : "secondary"}
          >
            {producto.publicado ? "Visible" : "Oculto"}
          </Chip>
        </div>
        {producto.publicado && (
          <NextLink
            href={`/p/${producto.slug}`}
            target="_blank"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Ver en la tienda <ArrowUpRightFromSquare />
          </NextLink>
        )}
      </div>

      {/* La categoría elegida en Datos filtra los grupos de características y variantes. */}
      <ProveedorCategoria
        key={`cat-${producto.categoriaId}`}
        inicial={producto.categoriaId}
        gruposPorCategoria={catalogos.gruposPorCategoria}
        categorias={catalogos.categorias}
      >
        {/* key: al guardar, router.refresh() trae datos nuevos y cada sección se reinicia con ellos. */}
        <FormularioDatos
          key={`datos-${producto.slug}-${producto.publicado}-${producto.aPedido}`}
          producto={producto}
          categorias={catalogos.categorias}
        />
        <GaleriaAdmin
          carpeta={`productos/${producto.id}`}
          imagenes={producto.imagenes}
          acciones={{
            registrar: registrarImagen.bind(null, producto.id),
            reordenar: reordenarImagenes.bind(null, producto.id),
            actualizarAlt,
            borrar: borrarImagen,
          }}
        />
        <EditorVariantes
          key={`var-${producto.aPedido}-${producto.variantes.map((v) => `${v.clave}:${v.stock}`).join()}`}
          productoId={producto.id}
          precioBase={producto.precio}
          aPedido={producto.aPedido}
          grupos={catalogos.grupos}
          variantes={producto.variantes}
        />
        {/* Lo opcional, plegado: la ficha corta es nombre, fotos, bases con precio y publicar. */}
        <Disclosure defaultExpanded={producto.etiquetas.length > 0 || !!producto.descripcion}>
          <Disclosure.Heading>
            <Disclosure.Trigger className="flex w-full items-center justify-between rounded-tarjeta border border-border bg-surface px-5 py-4 font-medium">
              Más detalles: fecha patria, dije, colores y descripción
              <Disclosure.Indicator />
            </Disclosure.Trigger>
          </Disclosure.Heading>
          <Disclosure.Content>
            <Disclosure.Body className="flex flex-col gap-5 pt-5">
              <EditorEtiquetas
                key={`et-${producto.etiquetas.join()}`}
                productoId={producto.id}
                grupos={catalogos.grupos}
                seleccionadas={producto.etiquetas}
              />
              <EditorDescripcion inicial={producto.descripcion} guardar={guardarDescripcion.bind(null, producto.id)} />
            </Disclosure.Body>
          </Disclosure.Content>
        </Disclosure>
      </ProveedorCategoria>
      {!producto.aPedido && (
        <Suspense fallback={<Skeleton className="h-40 rounded-tarjeta" />}>
          <HistorialStock supabase={supabase} productoId={producto.id} nombres={nombres} />
        </Suspense>
      )}
      <BorrarProducto id={producto.id} nombre={producto.nombre} />
    </>
  );
}
