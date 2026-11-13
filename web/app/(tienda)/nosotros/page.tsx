import type { Metadata } from "next";
import { Hero } from "@/components/tienda/inicio/hero";
import { Preguntas, Trabajos } from "@/components/tienda/inicio/mas-secciones";
import { Beneficios, ComoComprar, Contacto, Personaliza, Problema, Sobre } from "@/components/tienda/inicio/secciones";
import { obtenerFotosPortada, obtenerRecientes, obtenerValoresGrupo } from "@/lib/catalogo/lecturas";
import { SITIO } from "@/lib/sitio";

export const metadata: Metadata = {
  title: "Quiénes somos",
  description: `${SITIO.nombre}: escarapelas y prendedores patrios hechos a mano en ${SITIO.ciudad}. Personalizá el tuyo.`,
  alternates: { canonical: "/nosotros" },
};

// La landing de El Precioso: portada con tres fotos fijas (SITIO.portadaNosotros), quiénes somos, más trabajos,
// personalización, cómo comprar, preguntas frecuentes y contacto. Los productos están en
// la portada del sitio (el catálogo). Las reseñas de la landing no eran reales: no se publican. Ver claude/web/tema-y-marca.md#nosotros
export default async function Nosotros() {
  const [bases, recientes, portada] = await Promise.all([
    obtenerValoresGrupo("base"),
    obtenerRecientes(12),
    obtenerFotosPortada(SITIO.portadaNosotros),
  ]);
  // Trabajos no repite las fotos de la portada.
  const enPortada = new Set(portada.map((f) => f.slug));
  const trabajos = recientes.filter((p) => !enPortada.has(p.slug));
  return (
    <div className="flex flex-col gap-16 pb-4 sm:gap-24">
      <div>
        <Hero fotos={portada} />
        <Problema />
        <Beneficios />
      </div>
      <Sobre />
      <Trabajos productos={trabajos} />
      <Personaliza bases={bases} />
      <ComoComprar />
      <Preguntas />
      <Contacto />
    </div>
  );
}
