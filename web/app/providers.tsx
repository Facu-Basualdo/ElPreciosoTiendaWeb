"use client";

import { I18nProvider, RouterProvider, Toast } from "@heroui/react";
import { useRouter } from "next/navigation";
import { SITIO } from "@/lib/sitio";

type OpcionesRouter = NonNullable<Parameters<ReturnType<typeof useRouter>["push"]>[1]>;

declare module "react-aria-components" {
  interface RouterConfig {
    routerOptions: OpcionesRouter;
  }
}

// Sin ThemeProvider: la tienda tiene un solo tema (claro). Ver claude/web/tema-y-marca.md
export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    // Los Link/Breadcrumbs de HeroUI con href navegan con el router de Next, sin recargar.
    <RouterProvider navigate={(href, opciones) => router.push(href, opciones)}>
      <I18nProvider locale={SITIO.locale}>
        {children}
        <Toast.Provider placement="bottom end" />
      </I18nProvider>
    </RouterProvider>
  );
}
