"use client";

import { ChevronLeft, ChevronRight } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { urlPublica } from "@/lib/supabase/storage";

type Imagen = { id: string; path: string; alt: string };

// HeroUI no tiene carrusel: Embla. Ver claude/web/heroui.md#excepciones-lo-que-heroui-no-trae
export function Galeria({ imagenes }: { imagenes: Imagen[] }) {
  const [refVisor, embla] = useEmblaCarousel({ loop: imagenes.length > 1 });
  const [actual, setActual] = useState(0);

  useEffect(() => {
    if (!embla) return;
    const alSeleccionar = () => setActual(embla.selectedScrollSnap());
    embla.on("select", alSeleccionar);
    return () => {
      embla.off("select", alSeleccionar);
    };
  }, [embla]);

  const ir = useCallback((i: number) => embla?.scrollTo(i), [embla]);

  if (!imagenes.length) {
    return <div className="mx-auto aspect-[9/16] w-full max-w-md rounded-[var(--radius)] bg-surface-secondary" />;
  }

  // Ancho tope: una foto 9:16 a media pantalla de escritorio mediría más de 1000 px de alto.
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3">
      <div className="relative overflow-hidden rounded-[var(--radius)] bg-surface-secondary" ref={refVisor}>
        <div className="flex">
          {imagenes.map((img, i) => (
            <div key={img.id} className="relative aspect-[9/16] min-w-0 flex-[0_0_100%]">
              <Image
                src={urlPublica(img.path)}
                alt={img.alt}
                fill
                sizes="(max-width: 448px) 100vw, 448px"
                priority={i === 0}
                className="object-cover"
              />
            </div>
          ))}
        </div>
        {imagenes.length > 1 && (
          <>
            <Button
              isIconOnly
              size="sm"
              variant="secondary"
              aria-label="Imagen anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2"
              onPress={() => embla?.scrollPrev()}
            >
              <ChevronLeft />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="secondary"
              aria-label="Imagen siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onPress={() => embla?.scrollNext()}
            >
              <ChevronRight />
            </Button>
          </>
        )}
      </div>

      {imagenes.length > 1 && (
        <div className="grid grid-cols-5 gap-2" aria-label="Miniaturas">
          {imagenes.map((img, i) => (
            <Button
              key={img.id}
              aria-label={`Ver imagen ${i + 1}${i === actual ? " (actual)" : ""}`}
              variant="ghost"
              onPress={() => ir(i)}
              className={`relative aspect-[9/16] h-auto w-full min-w-0 overflow-hidden rounded-[var(--radius)] p-0 ${
                i === actual ? "ring-2 ring-foreground" : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={urlPublica(img.path)} alt="" fill sizes="10vw" className="object-cover" />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
