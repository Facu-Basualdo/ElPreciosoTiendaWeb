"use client";

import { useEffect, useState } from "react";

/**
 * Barra fija abajo en el celular con el precio y la acción de la ficha. Aparece sólo
 * cuando los botones de la ficha no se ven (arriba está la foto 9:16, que ocupa toda
 * la pantalla) y se esconde al llegar al pie, para no taparlo. Desde lg no existe: ahí
 * precio y botones están al lado de la foto.
 */
export function BarraCompra({ objetivo, children }: { objetivo: React.RefObject<HTMLElement | null>; children: React.ReactNode }) {
  const [ver, setVer] = useState(false);

  useEffect(() => {
    const acciones = objetivo.current;
    const pie = document.querySelector("footer");
    let accionesVisibles = true;
    let pieVisible = false;
    const observador = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        if (e.target === acciones) accionesVisibles = e.isIntersecting;
        else pieVisible = e.isIntersecting;
      }
      setVer(!accionesVisibles && !pieVisible);
    });
    if (acciones) observador.observe(acciones);
    if (pie) observador.observe(pie);
    return () => observador.disconnect();
  }, [objetivo]);

  return (
    <div
      inert={!ver}
      aria-hidden={!ver}
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md transition-transform duration-300 motion-reduce:transition-none lg:hidden ${
        ver ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-xl items-center gap-3">{children}</div>
    </div>
  );
}
