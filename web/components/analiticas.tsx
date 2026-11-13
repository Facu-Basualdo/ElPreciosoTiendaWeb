"use client";

import { Analytics } from "@vercel/analytics/next";

/**
 * Vercel Web Analytics (visitas y páginas más vistas, sin cookies). Sólo la tienda: las
 * visitas al panel son de la dueña y no se cuentan. Client component porque `beforeSend`
 * es una función y el layout es server. En local no manda nada (sólo corre en Vercel).
 * Ver claude/general/entorno-y-deploy.md#analíticas
 */
export function Analiticas() {
  return <Analytics beforeSend={(evento) => (new URL(evento.url).pathname.startsWith("/admin") ? null : evento)} />;
}
