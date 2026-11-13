"use client";

import { Description, Disclosure, Form, Input, Label, ListBox, NumberField, Select, Switch, TextField, toast } from "@heroui/react";
import { useEffect, useState } from "react";
import { guardarDatos, guardarEtiquetas } from "@/app/admin/(panel)/productos/acciones";
import type { GrupoAdmin, ProductoAdmin } from "@/lib/admin/productos";
import { SITIO } from "@/lib/sitio";
import { Seccion } from "../seccion";
import { CamposCaracteristicas } from "./campos-caracteristicas";
import { useCategoriaProducto } from "./categoria-producto";
import { usePrecioEnVivo, useSeccionGuardable } from "./guardado";

const SIN_CATEGORIA = "sin-categoria";
const NOMBRE_BORRADOR = "Producto nuevo";
const formatoPrecio = { style: "currency", currency: SITIO.moneda, maximumFractionDigits: 0 } as const;
const mismas = (a: string[], b: string[]) => [...a].sort().join() === [...b].sort().join();

export function FormularioDatos({
  producto,
  categorias,
  grupos,
  cantidadFotos,
  precioEnBases,
}: {
  producto: ProductoAdmin;
  categorias: { id: string; nombre: string }[];
  grupos: GrupoAdmin[];
  /** Para avisar qué falta antes de mostrarlo en la tienda. */
  cantidadFotos: number;
  /** Alguna base tiene precio propio: entonces el precio de arriba puede quedar en 0. */
  precioEnBases: boolean;
}) {
  const nombreInicial = producto.nombre === NOMBRE_BORRADOR ? "" : producto.nombre;
  const [nombre, setNombre] = useState(nombreInicial);
  const [precio, setPrecio] = useState(producto.precio);
  const [precioAnterior, setPrecioAnterior] = useState<number | null>(producto.precioAnterior);
  const [categoriaId, setCategoriaId] = useState<string | null>(producto.categoriaId);
  const { setCategoriaId: avisarCategoria } = useCategoriaProducto();
  const [publicado, setPublicado] = useState(producto.publicado);
  const [etiquetas, setEtiquetas] = useState(producto.etiquetas);
  const { fijar: avisarPrecio } = usePrecioEnVivo();
  useEffect(() => avisarPrecio(Math.round(precio || 0)), [precio, avisarPrecio]);

  // Contra las props (no contra el primer render): después de guardar, el refresh trae
  // los valores nuevos y la sección vuelve a quedar limpia aunque no se remonte.
  const etiquetasCambiaron = !mismas(etiquetas, producto.etiquetas);
  const sucio =
    nombre.trim() !== nombreInicial ||
    Math.round(precio || 0) !== producto.precio ||
    (precioAnterior ?? null) !== producto.precioAnterior ||
    categoriaId !== producto.categoriaId ||
    publicado !== producto.publicado ||
    etiquetasCambiaron;

  async function guardar() {
    if (!nombre.trim()) {
      toast.danger("Ponele un nombre al producto.");
      return false;
    }
    const r = await guardarDatos(producto.id, {
      nombre,
      precio: Math.round(precio || 0),
      precioAnterior: precioAnterior === null || Number.isNaN(precioAnterior) ? null : Math.round(precioAnterior),
      categoriaId,
      // La home de El Precioso muestra los más nuevos, no los destacados: se conserva el valor.
      destacado: producto.destacado,
      publicado,
      // El Precioso no maneja stock: todo es a pedido. Se conserva el valor de la base.
      aPedido: producto.aPedido,
    });
    if (!r.ok) {
      toast.danger(r.error);
      return false;
    }
    if (etiquetasCambiaron) {
      const e = await guardarEtiquetas(producto.id, etiquetas);
      if (!e.ok) {
        toast.danger(e.error);
        return false;
      }
    }
    return true;
  }
  useSeccionGuardable("datos", 1, sucio, guardar);

  // Lo que le falta para verse bien en la tienda. No bloquea: sólo avisa.
  const faltan = [
    !nombre.trim() && "el nombre",
    cantidadFotos === 0 && "una foto",
    !precio && !precioEnBases && "el precio (sin precio se muestra «Precio a consultar»)",
  ].filter(Boolean) as string[];
  const listaFaltan = faltan.length > 1 ? `${faltan.slice(0, -1).join(", ")} y ${faltan.at(-1)}` : faltan[0];

  return (
    <Seccion id="datos" titulo="Nombre y precio">
      <Form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
        <TextField isRequired value={nombre} onChange={setNombre} maxLength={120} className="md:col-span-2">
          <Label>Nombre</Label>
          <Input placeholder="Modelo Nº 100, Escarapela con dije de sol…" />
          {/* El slug lo arma el servidor con el nombre: ver claude/web/dashboard.md#slugs */}
          <Description>
            {producto.slug.startsWith("borrador-")
              ? "Es el que ve la gente en la tienda."
              : `Dirección en la tienda: ${SITIO.url.replace(/^https?:\/\//, "")}/p/${producto.slug}${producto.publicado ? "" : " (sigue al nombre hasta que lo publiques)"}`}
          </Description>
        </TextField>

        <NumberField value={precio} onChange={(v) => setPrecio(v ?? 0)} minValue={0} formatOptions={formatoPrecio}>
          <Label>Precio</Label>
          <NumberField.Group>
            <NumberField.Input />
          </NumberField.Group>
          <Description>Si tiene varias bases, cada una puede tener su precio (abajo).</Description>
        </NumberField>

        {/* Precio tachado: es una oferta, va con las promociones (SITIO.ventasAvanzadas). */}
        {SITIO.ventasAvanzadas && (
          <NumberField
            value={precioAnterior ?? Number.NaN}
            onChange={(v) => setPrecioAnterior(v === undefined || Number.isNaN(v) ? null : v)}
            minValue={0}
            formatOptions={formatoPrecio}
          >
            <Label>Precio anterior (opcional)</Label>
            <NumberField.Group>
              <NumberField.Input />
            </NumberField.Group>
            <Description>Si es mayor que el precio, se muestra tachado con el ahorro.</Description>
          </NumberField>
        )}

        {categorias.length > 0 && (
          <Select
            value={categoriaId ?? SIN_CATEGORIA}
            onChange={(v) => {
              const id = v === SIN_CATEGORIA || typeof v !== "string" ? null : v;
              setCategoriaId(id);
              avisarCategoria(id);
            }}
          >
            <Label>Categoría</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id={SIN_CATEGORIA} textValue="Sin categoría">
                  Sin categoría
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {categorias.map((c) => (
                  <ListBox.Item key={c.id} id={c.id} textValue={c.nombre}>
                    {c.nombre}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        )}

        {/* Opcional y plegado: abierto si el producto ya tiene alguna característica. */}
        <Disclosure defaultExpanded={producto.etiquetas.length > 0} className="rounded-xl border border-border md:col-span-2">
          <Disclosure.Heading>
            <Disclosure.Trigger className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium">
              <span>
                Características <span className="font-normal text-muted">(opcional): fecha patria, dije, colores</span>
              </span>
              <Disclosure.Indicator />
            </Disclosure.Trigger>
          </Disclosure.Heading>
          <Disclosure.Content>
            <Disclosure.Body className="px-4 pb-4">
              <CamposCaracteristicas grupos={grupos} seleccionadas={etiquetas} onChange={setEtiquetas} />
            </Disclosure.Body>
          </Disclosure.Content>
        </Disclosure>

        <div className="flex flex-col gap-2 rounded-xl bg-surface-secondary p-4 md:col-span-2">
          <Switch isSelected={publicado} onChange={setPublicado}>
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Label className="font-medium">Mostrar en la tienda</Label>
            </Switch.Content>
          </Switch>
          <p className="text-xs text-muted">
            {publicado ? "La gente lo ve en el catálogo." : "Oculto: sólo lo ves vos acá."}
            {listaFaltan && (publicado ? ` Le falta ${listaFaltan}.` : ` Antes de mostrarlo, falta ${listaFaltan}.`)}
          </p>
        </div>
      </Form>
    </Seccion>
  );
}
