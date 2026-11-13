import NextLink from "next/link";
import { Logo } from "@/components/logo";
import { SITIO } from "@/lib/sitio";
import { enlaceWhatsapp } from "@/lib/whatsapp";

export function Pie() {
  return (
    <footer className="mt-20 bg-encabezado text-encabezado-foreground">
      <div className="contenedor grid gap-10 py-14 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Logo className="text-2xl" />
          <p className="max-w-sm text-sm text-white/65">{SITIO.descripcion}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="antetitulo text-dorado">Contacto</p>
          <a href={enlaceWhatsapp()} target="_blank" rel="noopener" className="hover:text-dorado">
            WhatsApp
          </a>
          <p className="text-white/65">{SITIO.horario}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="antetitulo text-dorado">Tienda</p>
          <NextLink href="/" className="hover:text-dorado">
            Catálogo
          </NextLink>
          <NextLink href="/nosotros" className="hover:text-dorado">
            Quiénes somos
          </NextLink>
          <NextLink href="/nosotros#personaliza" className="hover:text-dorado">
            Personalizá el tuyo
          </NextLink>
          <NextLink href="/carrito" className="hover:text-dorado">
            Carrito
          </NextLink>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="contenedor py-5 text-xs text-white/50">
          {SITIO.nombre} · Hecho a mano en {SITIO.ciudad}, Argentina
        </p>
      </div>
    </footer>
  );
}
