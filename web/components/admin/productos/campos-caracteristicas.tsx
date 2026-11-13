"use client";

import { useState } from "react";
import type { EtiquetaAdmin, GrupoAdmin } from "@/lib/admin/productos";
import { AvisoCategoria, useGruposPermitidos } from "./categoria-producto";
import { SelectorEtiquetas } from "./selector-etiquetas";

// Características (fecha patria, dije, colores…) dentro del formulario de Datos: se
// guardan con "Guardar datos". La base va en Bases y precios: la base rechaza etiquetas de
// grupos de variante en producto_etiquetas. Ver claude/web/dashboard.md#productos
export function CamposCaracteristicas({
  grupos: iniciales,
  seleccionadas,
  onChange,
}: {
  grupos: GrupoAdmin[];
  seleccionadas: string[];
  onChange: (ids: string[]) => void;
}) {
  const [grupos, setGrupos] = useState(iniciales.filter((g) => !g.esVariante));
  const permitidos = useGruposPermitidos();

  const deGrupo = (g: GrupoAdmin) => seleccionadas.filter((id) => g.etiquetas.some((e) => e.id === id));
  const reemplazarGrupo = (g: GrupoAdmin, ids: string[]) =>
    onChange([...seleccionadas.filter((id) => !g.etiquetas.some((e) => e.id === id)), ...ids]);
  const agregarEtiqueta = (grupoId: string, e: EtiquetaAdmin) =>
    setGrupos((gs) => gs.map((g) => (g.id === grupoId ? { ...g, etiquetas: [...g.etiquetas, e] } : g)));

  return (
    <div className="flex flex-col gap-4">
      <AvisoCategoria que="las características" />
      <div className="grid gap-5 md:grid-cols-2">
        {/* La marca va siempre; un grupo con valores ya cargados se muestra aunque no sea de
            la categoría, para no esconder datos. */}
        {grupos
          .filter((g) => g.esMarca || !permitidos || permitidos.has(g.id) || deGrupo(g).length > 0)
          .map((g) => (
            <SelectorEtiquetas
              key={g.id}
              grupo={g}
              unica={g.esMarca}
              seleccionadas={deGrupo(g)}
              onChange={(ids) => reemplazarGrupo(g, ids)}
              onEtiquetaCreada={agregarEtiqueta}
            />
          ))}
      </div>
    </div>
  );
}
