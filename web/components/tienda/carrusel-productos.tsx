"use client";

import { ChevronLeft, ChevronRight } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import useEmblaCarousel from "embla-carousel-react";
import { Children } from "react";

// Fila deslizable de tarjetas (últimos ingresos de la home). Las tarjetas son server components.
export function CarruselProductos({
  titulo,
  antetitulo,
  children,
}: {
  titulo: React.ReactNode;
  antetitulo?: string;
  children: React.ReactNode;
}) {
  const [ref, embla] = useEmblaCarousel({ align: "start", dragFree: true, containScroll: "trimSnaps" });

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          {antetitulo && <p className="antetitulo text-celeste-oscuro">{antetitulo}</p>}
          <h2 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">{titulo}</h2>
        </div>
        <div className="flex gap-2">
          <Button isIconOnly size="sm" variant="outline" aria-label="Anteriores" onPress={() => embla?.scrollPrev()}>
            <ChevronLeft />
          </Button>
          <Button isIconOnly size="sm" variant="outline" aria-label="Siguientes" onPress={() => embla?.scrollNext()}>
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="-mx-1 overflow-hidden px-1 py-1" ref={ref}>
        <div className="flex gap-3 sm:gap-4">
          {Children.map(children, (hijo) => (
            <div className="min-w-0 flex-[0_0_62%] sm:flex-[0_0_36%] lg:flex-[0_0_calc(25%-0.75rem)] 2xl:flex-[0_0_calc(20%-0.8rem)]">{hijo}</div>
          ))}
        </div>
      </div>
    </section>
  );
}
