/** Antetítulo en versalitas + título en Fraunces, como en la landing. */
export function TituloSeccion({
  id,
  antetitulo,
  titulo,
  centrado = false,
  oscuro = false,
}: {
  id?: string;
  antetitulo: string;
  titulo: React.ReactNode;
  centrado?: boolean;
  oscuro?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-3 ${centrado ? "items-center text-center" : ""}`}>
      <p className={`antetitulo ${oscuro ? "text-dorado" : "text-celeste-oscuro"}`}>{antetitulo}</p>
      <h2 id={id} className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
        {titulo}
      </h2>
    </div>
  );
}
