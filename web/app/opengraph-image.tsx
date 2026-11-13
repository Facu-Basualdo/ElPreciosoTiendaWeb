import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { SITIO } from "@/lib/sitio";

// Imagen por defecto al compartir un link de la tienda (las fichas usan la foto del
// producto): la bandera del hero con un velo azul noche, el nombre con la huella como en
// components/logo.tsx y la frase de la portada. Se genera en el build (estática).
export const alt = `${SITIO.nombre} · Escarapelas y prendedores artesanales`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function Huella({ tamano }: { tamano: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="#fcbf49">
      <ellipse cx="12" cy="16.2" rx="5.2" ry="4.4" />
      <ellipse cx="4.6" cy="10.4" rx="2.2" ry="2.7" transform="rotate(-22 4.6 10.4)" />
      <ellipse cx="9.2" cy="5.4" rx="2.3" ry="2.9" transform="rotate(-8 9.2 5.4)" />
      <ellipse cx="14.8" cy="5.4" rx="2.3" ry="2.9" transform="rotate(8 14.8 5.4)" />
      <ellipse cx="19.4" cy="10.4" rx="2.2" ry="2.7" transform="rotate(22 19.4 10.4)" />
    </svg>
  );
}

export default async function Image() {
  // JPEG y no WebP: el renderizador de next/og no lee WebP. Tampoco entiende `inset`:
  // las capas van con top/left y medidas.
  const fondo = await readFile(path.join(process.cwd(), "public/marca/og-fondo.jpg"));
  const nombre = SITIO.nombre.toUpperCase();
  const o = nombre.indexOf("O", nombre.indexOf(" ") + 1);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0e1b2c" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- next/og renderiza HTML plano, no next/image */}
        <img
          src={`data:image/jpeg;base64,${fondo.toString("base64")}`}
          alt=""
          width={1200}
          height={630}
          style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            background: "linear-gradient(120deg, rgba(14,27,44,0.92) 0%, rgba(14,27,44,0.7) 55%, rgba(14,27,44,0.35) 100%)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: 88, color: "#f7f5f0" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 104, fontWeight: 700, letterSpacing: -3 }}>
            {o < 0 ? (
              nombre
            ) : (
              <>
                <span>{nombre.slice(0, o)}</span>
                <Huella tamano={92} />
                <span>{nombre.slice(o + 1)}</span>
              </>
            )}
          </div>
          <p style={{ marginTop: 28, fontSize: 46, color: "#fcbf49" }}>Llevá la patria, cerca del corazón.</p>
          <p style={{ marginTop: 8, fontSize: 30, color: "#d7e2ee", maxWidth: 820 }}>{SITIO.descripcion}</p>
        </div>
      </div>
    ),
    size,
  );
}
