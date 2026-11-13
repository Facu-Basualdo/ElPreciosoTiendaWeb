import { ArrowRight } from "@gravity-ui/icons";
import { buttonVariants } from "@heroui/styles";
import Image from "next/image";
import NextLink from "next/link";
import poster from "@/public/marca/bandera-poster.webp";

// Bandera flameando de fondo. El poster (next/image con priority) es el LCP; el video
// lo tapa cuando arranca. Con "reducir movimiento" el video no se muestra.
export function Hero() {
  return (
    <section className="relative isolate flex min-h-[540px] items-center overflow-hidden bg-encabezado text-marfil h-[calc(88svh-4rem)] max-h-[860px]">
      <Image src={poster} alt="" fill priority sizes="100vw" placeholder="blur" className="-z-20 object-cover" />
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/marca/bandera-poster.webp"
        aria-hidden
        className="absolute inset-0 -z-20 size-full object-cover motion-reduce:hidden"
      >
        <source src="/marca/bandera.webm" type="video/webm" />
        <source src="/marca/bandera.mp4" type="video/mp4" />
      </video>
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-br from-noche/75 via-noche/40 to-noche/60" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-b from-transparent to-background" />

      <div className="contenedor flex flex-col items-start gap-6 pb-10">
        <p className="antetitulo text-dorado">Escarapelas y prendedores artesanales</p>
        <h1 className="max-w-3xl font-serif text-5xl leading-[1.05] tracking-tight sm:text-7xl">
          Llevá la patria,
          <br />
          <em className="text-dorado">cerca del corazón.</em>
        </h1>
        <p className="max-w-xl text-base text-marfil/85 sm:text-lg">
          Hechos a mano, con tiempo, para los actos y las fechas patrias. Pensados para durar.
        </p>
        <div className="flex flex-wrap gap-3">
          <NextLink href="/" className={buttonVariants({ size: "lg" })}>
            Ver catálogo
            <ArrowRight aria-hidden />
          </NextLink>
          <NextLink
            href="#personaliza"
            className={`${buttonVariants({ size: "lg", variant: "outline" })} border-marfil/40 text-marfil hover:bg-marfil/10`}
          >
            Personalizá el tuyo
          </NextLink>
        </div>
      </div>
    </section>
  );
}
