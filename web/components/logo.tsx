import { SITIO } from "@/lib/sitio";
import { Huella } from "./huella";

// Palabra en mayúsculas muy pesadas con la primera "O" del segundo término como huella
// ("EL PRECI🐾SO"), como en la plantilla de las fotos. Todo en currentColor: sobre las
// franjas oscuras basta con cambiar el color del texto. Ver claude/web/tema-y-marca.md
export function Logo({ className }: { className?: string }) {
  const nombre = SITIO.nombre.toUpperCase();
  const o = nombre.indexOf("O", nombre.indexOf(" ") + 1);

  return (
    <span
      role="img"
      aria-label={SITIO.nombre}
      className={`inline-flex items-center whitespace-nowrap text-xl font-black uppercase leading-none tracking-[-0.03em] ${className ?? ""}`}
    >
      {o < 0 ? (
        nombre
      ) : (
        <>
          {nombre.slice(0, o)}
          <Huella className="mx-[0.04em] size-[0.86em] -translate-y-[0.02em]" />
          {nombre.slice(o + 1)}
        </>
      )}
    </span>
  );
}
