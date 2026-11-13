import { ArrowLeft } from "@gravity-ui/icons";
import type { Metadata } from "next";
import NextLink from "next/link";
import { CambiarContrasena } from "@/components/admin/cambiar-contrasena";
import { Seccion } from "@/components/admin/seccion";

export const metadata: Metadata = { title: "Mi contraseña" };

// La guardia de admin la pone el layout del panel; la acción vuelve a chequear.
export default function PaginaContrasena() {
  return (
    <div className="flex flex-col gap-5">
      <NextLink href="/admin/ajustes" className="flex items-center gap-2 self-start text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-4" /> Ajustes
      </NextLink>
      <h1 className="text-2xl font-semibold tracking-tight">Mi contraseña</h1>
      <Seccion titulo="Cambiar contraseña" descripcion="Cambia la contraseña con la que entrás a este panel. La sesión abierta sigue andando.">
        <CambiarContrasena />
      </Seccion>
    </div>
  );
}
