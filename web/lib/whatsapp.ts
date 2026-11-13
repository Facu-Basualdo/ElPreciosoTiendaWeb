import { SITIO } from "./sitio";

/** Link a un chat con la tienda, con el mensaje ya escrito. */
export function enlaceWhatsapp(mensaje?: string): string {
  const base = `https://wa.me/${SITIO.whatsapp}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}
