"use client";

import { Bars } from "@gravity-ui/icons";
import { Button, Drawer } from "@heroui/react";
import NextLink from "next/link";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { SITIO } from "@/lib/sitio";
import { enlaceWhatsapp } from "@/lib/whatsapp";

export function MenuMovil({ enlaces }: { enlaces: { href: string; texto: string }[] }) {
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);

  return (
    <div className="lg:hidden">
      <Button isIconOnly variant="ghost" aria-label="Abrir menú" onPress={() => setAbierto(true)}>
        <Bars />
      </Button>
      <Drawer.Backdrop isOpen={abierto} onOpenChange={setAbierto}>
        <Drawer.Content placement="left">
          <Drawer.Dialog>
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Heading>
                <Logo />
              </Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body>
              <nav aria-label="Secciones" className="flex flex-col gap-5">
                {enlaces.map((e) => (
                  <NextLink key={e.href} href={e.href} onClick={cerrar} className="font-serif text-xl">
                    {e.texto}
                  </NextLink>
                ))}
              </nav>
              <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-sm text-muted">
                <a href={enlaceWhatsapp()} target="_blank" rel="noopener" className="font-medium text-foreground">
                  Escribinos por WhatsApp
                </a>
                <a href={`https://instagram.com/${SITIO.instagram}`} target="_blank" rel="noopener">
                  @{SITIO.instagram}
                </a>
                <p>{SITIO.horario}</p>
              </div>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </div>
  );
}
