// Funciones del editor de fotos del panel: quitar el fondo, recortar lo transparente,
// ajustar brillo/contraste/saturación y componer sobre la plantilla de marca.
// Todo corre en el navegador. Ver claude/web/editor-de-fotos.md

/** Tamaño de la foto final: el de la plantilla y el formato `producto` (9:16). */
export const LIENZO = { ancho: 1080, alto: 1920 } as const;

/**
 * Zona libre de la plantilla, en fracciones del lienzo: entre la bandera y el logo
 * (arriba) y la moneda (abajo). El objeto se ubica centrado ahí al empezar.
 */
export const ZONA = { x: 0.08, y: 0.36, ancho: 0.84, alto: 0.5 } as const;

export const PLANTILLA = "/marca/plantilla.webp";

/** Centro (px del lienzo), escala sobre el tamaño del objeto y giro en grados. */
export type Transformacion = { cx: number; cy: number; escala: number; angulo: number };
/** 1 = sin cambio. */
export type Ajustes = { brillo: number; contraste: number; saturacion: number };
export const SIN_AJUSTES: Ajustes = { brillo: 1, contraste: 1, saturacion: 1 };

/** Lado máximo del objeto recortado: más no se nota en 1080 px y frena los ajustes. */
const LADO_MAXIMO = 1600;

export function cargarImagenUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolver, rechazar) => {
    const img = new Image();
    img.onload = () => resolver(img);
    img.onerror = () => rechazar(new Error("No se pudo leer la imagen"));
    img.src = url;
  });
}

/**
 * Quita el fondo con @imgly/background-removal (WASM, en el navegador, sin costo por
 * uso). El modelo (~80 MB) se baja la primera vez y queda en la caché del navegador.
 * `alProgresar` recibe 0–1 mientras descarga.
 */
export async function quitarFondo(foto: Blob, alProgresar: (fraccion: number) => void): Promise<Blob> {
  const { removeBackground } = await import("@imgly/background-removal");
  const descargas = new Map<string, number>();
  return removeBackground(foto, {
    model: "isnet_fp16",
    output: { format: "image/png" },
    progress: (clave, actual, total) => {
      if (!clave.startsWith("fetch:") || !total) return;
      descargas.set(clave, actual / total);
      const valores = [...descargas.values()];
      alProgresar(valores.reduce((a, b) => a + b, 0) / valores.length);
    },
  });
}

/** Lleva la imagen a un canvas recortado a su parte no transparente (y a LADO_MAXIMO). */
export function recortarTransparencia(img: HTMLImageElement): HTMLCanvasElement {
  const lienzo = document.createElement("canvas");
  lienzo.width = img.naturalWidth;
  lienzo.height = img.naturalHeight;
  const ctx = lienzo.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas no disponible");
  ctx.drawImage(img, 0, 0);

  const { data, width, height } = ctx.getImageData(0, 0, lienzo.width, lienzo.height);
  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 12) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) {
    // Todo transparente (el modelo no encontró nada): se usa la imagen entera.
    x0 = 0;
    y0 = 0;
    x1 = width - 1;
    y1 = height - 1;
  }

  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const factor = Math.min(1, LADO_MAXIMO / Math.max(w, h));
  const salida = document.createElement("canvas");
  salida.width = Math.round(w * factor);
  salida.height = Math.round(h * factor);
  const sctx = salida.getContext("2d");
  if (!sctx) throw new Error("Canvas no disponible");
  sctx.imageSmoothingQuality = "high";
  sctx.drawImage(lienzo, x0, y0, w, h, 0, 0, salida.width, salida.height);
  return salida;
}

/**
 * Brillo, contraste y saturación píxel por píxel. No usa `ctx.filter`: Safari no lo
 * soporta en canvas y la foto saldría distinta en el iPhone.
 */
export function aplicarAjustes(origen: HTMLCanvasElement, { brillo, contraste, saturacion }: Ajustes): HTMLCanvasElement {
  if (brillo === 1 && contraste === 1 && saturacion === 1) return origen;
  const salida = document.createElement("canvas");
  salida.width = origen.width;
  salida.height = origen.height;
  const ctx = salida.getContext("2d", { willReadFrequently: true });
  if (!ctx) return origen;
  ctx.drawImage(origen, 0, 0);
  const imagen = ctx.getImageData(0, 0, salida.width, salida.height);
  const d = imagen.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    let r = d[i] * brillo;
    let g = d[i + 1] * brillo;
    let b = d[i + 2] * brillo;
    r = (r - 128) * contraste + 128;
    g = (g - 128) * contraste + 128;
    b = (b - 128) * contraste + 128;
    const gris = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    d[i] = gris + (r - gris) * saturacion;
    d[i + 1] = gris + (g - gris) * saturacion;
    d[i + 2] = gris + (b - gris) * saturacion;
  }
  ctx.putImageData(imagen, 0, 0);
  return salida;
}

/** El objeto centrado en la zona libre, lo más grande posible sin salirse. */
export function transformacionInicial(objeto: { width: number; height: number }): Transformacion {
  const zw = ZONA.ancho * LIENZO.ancho;
  const zh = ZONA.alto * LIENZO.alto;
  return {
    cx: (ZONA.x + ZONA.ancho / 2) * LIENZO.ancho,
    cy: (ZONA.y + ZONA.alto / 2) * LIENZO.alto,
    escala: Math.min(zw / objeto.width, zh / objeto.height),
    angulo: 0,
  };
}

/** Plantilla de fondo + objeto transformado, con sombra suave para que no parezca pegado. */
export function dibujar(
  ctx: CanvasRenderingContext2D,
  plantilla: HTMLImageElement,
  objeto: HTMLCanvasElement,
  t: Transformacion,
  sombra: boolean,
) {
  ctx.clearRect(0, 0, LIENZO.ancho, LIENZO.alto);
  ctx.drawImage(plantilla, 0, 0, LIENZO.ancho, LIENZO.alto);
  ctx.save();
  ctx.translate(t.cx, t.cy);
  ctx.rotate((t.angulo * Math.PI) / 180);
  if (sombra) {
    ctx.shadowColor = "rgba(14, 27, 44, 0.32)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 16;
  }
  const w = objeto.width * t.escala;
  const h = objeto.height * t.escala;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(objeto, -w / 2, -h / 2, w, h);
  ctx.restore();
}

/** La foto final en WebP 1080×1920, lista para subir como imagen de producto. */
export function exportar(plantilla: HTMLImageElement, objeto: HTMLCanvasElement, t: Transformacion, sombra: boolean): Promise<Blob> {
  const lienzo = document.createElement("canvas");
  lienzo.width = LIENZO.ancho;
  lienzo.height = LIENZO.alto;
  const ctx = lienzo.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas no disponible"));
  dibujar(ctx, plantilla, objeto, t, sombra);
  return new Promise((resolver, rechazar) =>
    lienzo.toBlob((b) => (b ? resolver(b) : rechazar(new Error("No se pudo exportar"))), "image/webp", 0.88),
  );
}
