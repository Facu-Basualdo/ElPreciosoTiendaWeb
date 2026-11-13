"use client";

import { Layers } from "@gravity-ui/icons";
import { Button, toast } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileTrigger } from "react-aria-components";
import { crearBorrador, registrarImagen } from "@/app/admin/(panel)/productos/acciones";
import { cargarImagen, exportarWebp, FORMATOS, necesitaRecorte, recorteCentrado } from "@/lib/admin/imagenes";
import { subirWebp } from "@/lib/admin/subir-imagen";

/**
 * Varias fotos de una → un borrador por foto, con la foto como principal. Las que no
 * son 9:16 se recortan al centro sin preguntar (para elegir el recorte, subirla desde la
 * ficha). Después se completa nombre, bases y precio en cada uno.
 */
export function CargaRapida({ className }: { className?: string }) {
  const router = useRouter();
  const [progreso, setProgreso] = useState<{ hechos: number; total: number } | null>(null);

  async function cargar(archivos: FileList | null) {
    const lista = [...(archivos ?? [])];
    if (!lista.length) return;
    setProgreso({ hechos: 0, total: lista.length });
    let creados = 0;
    for (const archivo of lista) {
      try {
        const img = await cargarImagen(archivo);
        const blob = await exportarWebp(img, "producto", necesitaRecorte(img, "producto") ? recorteCentrado(img, "producto") : undefined);
        URL.revokeObjectURL(img.src);
        const borrador = await crearBorrador();
        if (!borrador.ok) throw new Error(borrador.error);
        const path = await subirWebp(`productos/${borrador.datos.id}`, blob);
        const r = await registrarImagen(borrador.datos.id, { path, ancho: FORMATOS.producto.ancho, alto: FORMATOS.producto.alto });
        if (!r.ok) throw new Error(r.error);
        creados++;
      } catch (e) {
        toast.danger(`"${archivo.name}": ${e instanceof Error ? e.message : "no se pudo cargar"}`);
      }
      setProgreso((p) => (p ? { ...p, hechos: p.hechos + 1 } : p));
    }
    setProgreso(null);
    if (creados) toast.success(`${creados} ${creados === 1 ? "borrador creado" : "borradores creados"}: completá nombre, bases y precio.`);
    router.refresh();
  }

  return (
    <FileTrigger acceptedFileTypes={["image/jpeg", "image/png", "image/webp"]} allowsMultiple onSelect={cargar}>
      <Button variant="outline" isPending={!!progreso} className={className}>
        {!progreso && <Layers />}
        {progreso ? `Cargando ${progreso.hechos + 1} de ${progreso.total}…` : "Cargar fotos"}
      </Button>
    </FileTrigger>
  );
}
