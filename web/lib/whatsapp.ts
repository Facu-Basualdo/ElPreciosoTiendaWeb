import { SITIO } from "./sitio";

/** Link a un chat con la tienda, con el mensaje ya escrito. */
export function enlaceWhatsapp(mensaje?: string): string {
  return enlaceChat(SITIO.whatsapp, mensaje);
}

/** Link a un chat con cualquier número (el del cliente, desde el panel). */
export function enlaceChat(numero: string, mensaje?: string): string {
  const base = `https://wa.me/${numero}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}

/**
 * Número que escribe un cliente argentino → formato de wa.me. "3624 123456" (10 dígitos,
 * con característica, sin 0 ni 15) pasa a 5493624123456; si ya trae el 54, queda igual.
 */
export function numeroArgentino(telefono: string): string {
  const d = telefono.replace(/\D/g, "");
  if (d.startsWith("54")) return d;
  if (d.length === 10) return `549${d}`;
  return d;
}
