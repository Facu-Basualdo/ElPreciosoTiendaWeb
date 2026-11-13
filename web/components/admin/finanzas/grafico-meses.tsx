import { Disclosure, Table } from "@heroui/react";
import { etiquetaMes, etiquetaMesCorta } from "@/lib/admin/finanzas";
import { formatearPrecio } from "@/lib/formato";

export type FilaMes = { mes: string; ingresos: number; gastos: number };

// Paleta validada con el validador de dataviz (azul y dorado de la marca, más profundos
// para que se distingan con daltonismo). El dorado no llega a 3:1 contra el blanco: por
// eso la tabla con los mismos números está siempre disponible debajo.
const SERIES = [
  { clave: "ingresos", nombre: "Ingresos", color: "#2f6fb0" },
  { clave: "gastos", nombre: "Gastos", color: "#c98a12" },
] as const;

const compacto = new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 });

/** Barras agrupadas por mes, un solo eje en pesos. Hover o foco muestra el detalle. */
export function GraficoMeses({ filas }: { filas: FilaMes[] }) {
  const maximo = Math.max(1, ...filas.flatMap((f) => [f.ingresos, f.gastos]));
  const guias = [1, 0.5];

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex gap-4 text-sm" aria-label="Referencias">
        {SERIES.map((s) => (
          <li key={s.clave} className="flex items-center gap-2">
            <span aria-hidden className="size-3 rounded-sm" style={{ background: s.color }} />
            {s.nombre}
          </li>
        ))}
      </ul>

      <div className="relative h-56">
        {/* Guías recesivas con su valor; la base es la línea de abajo. */}
        {guias.map((g) => (
          <div key={g} aria-hidden className="absolute inset-x-0 border-t border-dashed border-separator" style={{ bottom: `${g * 100}%` }}>
            <span className="absolute -top-2.5 left-0 bg-surface pr-1 text-[11px] text-muted">$ {compacto.format(maximo * g)}</span>
          </div>
        ))}
        <div className="absolute inset-x-0 bottom-0 border-t border-border" aria-hidden />

        <ol className="absolute inset-0 flex items-end gap-1 pl-12 sm:gap-2">
          {filas.map((f) => {
            const resultado = f.ingresos - f.gastos;
            return (
              <li
                key={f.mes}
                tabIndex={0}
                aria-label={`${etiquetaMes(f.mes)}: ingresos ${formatearPrecio(f.ingresos)}, gastos ${formatearPrecio(f.gastos)}`}
                className="group relative flex h-full flex-1 items-end justify-center gap-0.5 rounded-md outline-none hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-focus"
              >
                {SERIES.map((s) => (
                  <span
                    key={s.clave}
                    aria-hidden
                    className="w-full max-w-4 rounded-t-[4px]"
                    style={{ height: `${(f[s.clave] / maximo) * 100}%`, minHeight: f[s.clave] > 0 ? 2 : 0, background: s.color }}
                  />
                ))}
                <span
                  aria-hidden
                  className="pointer-events-none absolute bottom-full z-10 mb-2 hidden w-44 rounded-lg border border-border bg-overlay p-2.5 text-xs shadow-[var(--overlay-shadow)] group-hover:block group-focus-visible:block"
                >
                  <span className="mb-1 block font-medium">{etiquetaMes(f.mes)}</span>
                  {SERIES.map((s) => (
                    <span key={s.clave} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-muted">
                        <span className="size-2 rounded-sm" style={{ background: s.color }} />
                        {s.nombre}
                      </span>
                      <span className="tabular-nums">{formatearPrecio(f[s.clave])}</span>
                    </span>
                  ))}
                  <span className="mt-1 flex justify-between border-t border-border pt-1">
                    <span className="text-muted">Resultado</span>
                    <span className="font-medium tabular-nums">{formatearPrecio(resultado)}</span>
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <ol aria-hidden className="flex gap-1 pl-12 text-[11px] text-muted sm:gap-2">
        {filas.map((f) => (
          <li key={f.mes} className="flex-1 text-center">
            {etiquetaMesCorta(f.mes)}
          </li>
        ))}
      </ol>

      <Disclosure>
        <Disclosure.Heading>
          <Disclosure.Trigger className="flex items-center gap-1 text-sm text-muted hover:text-foreground">
            Ver los números en una tabla
            <Disclosure.Indicator />
          </Disclosure.Trigger>
        </Disclosure.Heading>
        <Disclosure.Content>
          <Disclosure.Body>
            <Table className="pt-3">
              <Table.ScrollContainer>
                <Table.Content aria-label="Ingresos y gastos por mes">
                  <Table.Header>
                    <Table.Column isRowHeader>Mes</Table.Column>
                    <Table.Column>Ingresos</Table.Column>
                    <Table.Column>Gastos</Table.Column>
                    <Table.Column>Resultado</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {filas.map((f) => (
                      <Table.Row key={f.mes} id={f.mes}>
                        <Table.Cell>{etiquetaMes(f.mes)}</Table.Cell>
                        <Table.Cell className="tabular-nums">{formatearPrecio(f.ingresos)}</Table.Cell>
                        <Table.Cell className="tabular-nums">{formatearPrecio(f.gastos)}</Table.Cell>
                        <Table.Cell className="tabular-nums">{formatearPrecio(f.ingresos - f.gastos)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
    </div>
  );
}
