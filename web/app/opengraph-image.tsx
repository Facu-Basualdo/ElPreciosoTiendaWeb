import { ImageResponse } from "next/og";
import { SITIO } from "@/lib/sitio";

// Imagen por defecto al compartir un link de la tienda (las fichas usan la foto del
// producto). Se genera en el build (estática).
// **Todo lo que importa va en el cuadrado del centro (630×630)**: WhatsApp, en la vista
// chica, recorta al centro en cuadrado. Con el nombre a todo el ancho quedaba "PRECI SO".
// Por eso el nombre va en dos líneas, como en la plantilla de las fotos. La fuente que
// trae next/og no tiene negrita: el grosor sale de WebkitTextStroke (sin bajar fuentes).
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
  const [primera, ...demas] = SITIO.nombre.toUpperCase().split(" ");
  const segunda = demas.join(" ");
  const o = segunda.indexOf("O");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f5f0",
          // Manchas de acuarela de la marca en las esquinas: se ven en la vista grande y el
          // recorte cuadrado las deja afuera.
          backgroundImage:
            "radial-gradient(circle at 0% 0%, rgba(116,172,223,0.55) 0%, rgba(116,172,223,0) 38%), radial-gradient(circle at 100% 100%, rgba(252,191,73,0.5) 0%, rgba(252,191,73,0) 40%), radial-gradient(circle at 100% 0%, rgba(116,172,223,0.25) 0%, rgba(116,172,223,0) 30%)",
          color: "#0e1b2c",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 560, textAlign: "center" }}>
          <div style={{ display: "flex", fontSize: 64, letterSpacing: 4, lineHeight: 1, WebkitTextStroke: "3px #0e1b2c" }}>{primera}</div>
          <div style={{ display: "flex", alignItems: "center", fontSize: 108, letterSpacing: -1, lineHeight: 1, WebkitTextStroke: "5px #0e1b2c" }}>
            {o < 0 ? (
              segunda
            ) : (
              <>
                <span>{segunda.slice(0, o)}</span>
                <Huella tamano={94} />
                <span>{segunda.slice(o + 1)}</span>
              </>
            )}
          </div>
          <div style={{ display: "flex", width: 96, height: 8, borderRadius: 8, background: "#fcbf49", marginTop: 30 }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 26, fontSize: 42, lineHeight: 1.2 }}>
            <span>Llevá la patria,</span>
            <span style={{ color: "#b07c12" }}>cerca del corazón.</span>
          </div>
          <p style={{ marginTop: 14, fontSize: 26, color: "#3a6f9f" }}>Hecho a mano en {SITIO.ciudad}</p>
        </div>
      </div>
    ),
    size,
  );
}
