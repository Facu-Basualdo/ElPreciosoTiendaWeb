// Única fuente del nombre y datos de la tienda. No escribas el nombre literal en
// ningún otro archivo: ver claude/web/tema-y-marca.md
export const SITIO = {
  nombre: "El Precioso",
  descripcion: "Escarapelas y prendedores patrios artesanales, hechos a mano en Resistencia, Chaco.",
  url: process.env.NEXT_PUBLIC_SITIO_URL ?? "http://localhost:3000",
  // Formato internacional sin "+" ni espacios. La variable permite probar con otro número.
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "5493625190286",
  instagram: "elprecioso.ok",
  ciudad: "Resistencia, Chaco",
  horario: "Lunes a sábados de 9 a 19 h",
  // Días de fabricación de un pedido. Pendiente de definir con la dueña (docs/plan-el-precioso.md).
  demoraDias: null as number | null,
  // Promociones, combos y cupones: el motor existe, pero la tienda arranca sin ellos.
  // En false se ocultan de la tienda y del panel (ver docs/plan-el-precioso.md, fase 4).
  ventasAvanzadas: false,
  // Productos (slug) cuyas fotos van en la portada de /nosotros, en este orden. Fijos a
  // propósito: los últimos publicados podían tener fotos mal encuadradas. Si uno se
  // despublica o cambia de slug, simplemente no aparece.
  portadaNosotros: ["modelo-n-99", "modelo-n-98", "modelo-88"],
  moneda: "ARS",
  locale: "es-AR",
} as const;
