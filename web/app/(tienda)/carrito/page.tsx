import type { Metadata } from "next";
import { PaginaCarrito } from "@/components/carrito/pagina-carrito";

export const metadata: Metadata = {
  title: "Carrito",
  robots: { index: false, follow: false },
};

export default function Carrito() {
  return (
    <div className="contenedor py-5 sm:py-8">
      <h1 className="font-serif mb-5 text-2xl font-normal tracking-tight sm:text-3xl">Carrito</h1>
      <PaginaCarrito />
    </div>
  );
}
