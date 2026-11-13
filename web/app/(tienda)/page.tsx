import { CarruselBanners } from "@/components/tienda/carrusel-banners";
import { metadataCatalogo, PaginaCatalogo } from "@/components/tienda/catalogo";
import { obtenerBanners } from "@/lib/catalogo/lecturas";

// La tienda abre directo en el catálogo (con los banners arriba si hay). Quiénes somos,
// Personalizá y contacto están en /nosotros. Ver claude/web/catalogo.md
export function generateMetadata(props: PageProps<"/">) {
  return metadataCatalogo(props.searchParams);
}

export default function Inicio(props: PageProps<"/">) {
  return <PaginaCatalogo searchParams={props.searchParams} banners={<Banners />} />;
}

async function Banners() {
  const banners = await obtenerBanners();
  if (!banners.length) return null;
  return (
    <div className="mb-6">
      <CarruselBanners banners={banners} />
    </div>
  );
}
