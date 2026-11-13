"use client";

import { Funnel } from "@gravity-ui/icons";
import { Button, Checkbox, CheckboxGroup, Disclosure, Drawer, Radio, RadioGroup, Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cantidadDeFiltros, conCambios, conGrupo, urlDeFiltros, type Filtros } from "@/lib/catalogo/filtros";
import type { Categoria, Faceta } from "@/lib/catalogo/lecturas";

const TODAS = "todas";

/**
 * Cada grupo de filtros es desplegable. El título dice cuántos hay elegidos, así un
 * grupo cerrado no esconde un filtro activo. Ver claude/web/etiquetas.md#panel-de-filtros
 */
function Desplegable({
  titulo,
  elegidos = 0,
  abierto,
  children,
}: {
  titulo: string;
  elegidos?: number;
  abierto: boolean;
  children: React.ReactNode;
}) {
  return (
    <Disclosure defaultExpanded={abierto} className="py-4 first:pt-0 last:pb-0">
      <Disclosure.Heading>
        <Disclosure.Trigger className="flex w-full items-center justify-between gap-2 text-left text-sm font-semibold">
          <span>
            {titulo}
            {elegidos > 0 && <span className="ml-1.5 font-normal text-muted">({elegidos})</span>}
          </span>
          <Disclosure.Indicator />
        </Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content>
        <Disclosure.Body className="pt-3">{children}</Disclosure.Body>
      </Disclosure.Content>
    </Disclosure>
  );
}

// Categorías arriba de todo y abiertas: una sola a la vez (Escarapelas, Prendedores…).
// Las hijas, con sangría debajo de su madre.
function Categorias({
  categorias,
  actual,
  onCambio,
}: {
  categorias: Categoria[];
  actual: string | null;
  onCambio: (cat: string | null) => void;
}) {
  if (!categorias.length) return null;
  const opciones = [
    { slug: TODAS, nombre: "Todas", hija: false },
    ...categorias.flatMap((c) => [
      { slug: c.slug, nombre: c.nombre, hija: false },
      ...c.hijas.map((h) => ({ slug: h.slug, nombre: h.nombre, hija: true })),
    ]),
  ];
  return (
    <Desplegable titulo="Categoría" abierto>
      <RadioGroup
        name="cat"
        aria-label="Categoría"
        value={actual ?? TODAS}
        onChange={(v) => onCambio(v === TODAS ? null : v)}
        className="flex flex-col gap-2.5"
      >
        {opciones.map((o) => (
          <Radio key={o.slug} value={o.slug} aria-label={o.nombre} className={o.hija ? "pl-6" : ""}>
            <Radio.Content className="w-full">
              <Radio.Control>
                <Radio.Indicator />
              </Radio.Control>
              <span className="text-sm">{o.nombre}</span>
            </Radio.Content>
          </Radio>
        ))}
      </RadioGroup>
    </Desplegable>
  );
}

const VISIBLES = 5;

// Facetas del RPC facetas_productos: nunca se cuentan en el cliente. Arrancan cerradas
// salvo que tengan algo elegido. Grupos largos muestran 5 opciones y "Ver más"; si hay
// una elegida entre las ocultas, arranca expandido (si no, el filtro activo no se ve).
function GrupoFaceta({
  faceta: f,
  valores,
  onCambio,
}: {
  faceta: Faceta;
  valores: string[];
  onCambio: (grupo: string, slugs: string[]) => void;
}) {
  const ocultaSeleccionada = f.opciones.slice(VISIBLES).some((o) => o.seleccionada);
  const [expandido, setExpandido] = useState(ocultaSeleccionada);
  const opciones = expandido ? f.opciones : f.opciones.slice(0, VISIBLES);

  return (
    <Desplegable titulo={f.nombre} elegidos={valores.length} abierto={valores.length > 0}>
      <div className="flex flex-col gap-3">
        <CheckboxGroup name={f.slug} aria-label={f.nombre} value={valores} onChange={(v) => onCambio(f.slug, v)} className="flex flex-col gap-2.5">
          {opciones.map((o) => (
            // Seleccionada con 0 resultados: se muestra deshabilitada para poder entender por qué no hay nada.
            <Checkbox key={o.slug} value={o.slug} isDisabled={o.cantidad === 0 && !o.seleccionada}>
              <Checkbox.Content className="w-full">
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <span className="flex flex-1 items-center gap-2 text-sm">
                  {o.colorHex && (
                    <span aria-hidden className="size-3.5 rounded-full ring-1 ring-muted/60" style={{ backgroundColor: o.colorHex }} />
                  )}
                  {o.valor}
                  <span className="ml-auto text-xs tabular-nums text-muted">{o.cantidad}</span>
                </span>
              </Checkbox.Content>
            </Checkbox>
          ))}
        </CheckboxGroup>
        {f.opciones.length > VISIBLES && (
          <Button variant="ghost" size="sm" className="self-start px-0 underline underline-offset-4" onPress={() => setExpandido((e) => !e)}>
            {expandido ? "Ver menos" : "Ver más (" + (f.opciones.length - VISIBLES) + ")"}
          </Button>
        )}
      </div>
    </Desplegable>
  );
}

/** Categoría + facetas, todos desplegables. Lo comparten la columna y el cajón del celular. */
function Grupos({
  categorias,
  facetas,
  filtros,
  onCategoria,
  onGrupo,
}: {
  categorias: Categoria[];
  facetas: Faceta[];
  filtros: Filtros;
  onCategoria: (cat: string | null) => void;
  onGrupo: (grupo: string, slugs: string[]) => void;
}) {
  return (
    <div className="flex flex-col divide-y divide-separator">
      <Categorias categorias={categorias} actual={filtros.cat} onCambio={onCategoria} />
      {facetas.map((f) => (
        <GrupoFaceta key={f.slug} faceta={f} valores={filtros.etiquetas[f.slug] ?? []} onCambio={onGrupo} />
      ))}
    </div>
  );
}

export function PanelFiltros({ facetas, filtros, categorias }: { facetas: Faceta[]; filtros: Filtros; categorias: Categoria[] }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const navegar = (f: Filtros) => iniciar(() => router.replace(urlDeFiltros(f), { scroll: false }));

  return (
    // Desktop: columna lateral, cada cambio navega. Sin scroll propio ni sticky: con los
    // grupos desplegables entra entera y acompaña el scroll de la página.
    <aside className="hidden w-64 shrink-0 self-start lg:block" aria-label="Filtros" aria-busy={pendiente}>
      <div className="flex flex-col gap-4 rounded-tarjeta border border-border bg-surface p-5">
        <div className="flex h-6 items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider">Filtrar</h2>
          {pendiente && <Spinner size="sm" color="current" />}
        </div>
        <Grupos
          categorias={categorias}
          facetas={facetas}
          filtros={filtros}
          onCategoria={(cat) => navegar(conCambios(filtros, { cat }))}
          onGrupo={(g, s) => navegar(conGrupo(filtros, g, s))}
        />
      </div>
    </aside>
  );
}

// Mobile: botón + Drawer. Va en la barra de herramientas, no como columna del layout.
export function BotonFiltrosMovil({ facetas, filtros, categorias }: { facetas: Faceta[]; filtros: Filtros; categorias: Categoria[] }) {
  const router = useRouter();
  const [, iniciar] = useTransition();
  const [abierto, setAbierto] = useState(false);
  // Los cambios se acumulan y se aplican con "Ver resultados": cada tilde sería una
  // navegación y en mobile se siente trabado.
  const [borrador, setBorrador] = useState(filtros);
  const navegar = (f: Filtros) => iniciar(() => router.replace(urlDeFiltros(f), { scroll: false }));
  const cantidad = cantidadDeFiltros(filtros) + (filtros.cat ? 1 : 0);

  return (
    <>
      <div className="lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onPress={() => {
            setBorrador(filtros);
            setAbierto(true);
          }}
        >
          <Funnel />
          Filtros{cantidad ? ` (${cantidad})` : ""}
        </Button>
        <Drawer.Backdrop isOpen={abierto} onOpenChange={setAbierto}>
          <Drawer.Content placement="right">
            <Drawer.Dialog>
              <Drawer.CloseTrigger />
              <Drawer.Header>
                <Drawer.Heading>Filtros</Drawer.Heading>
              </Drawer.Header>
              <Drawer.Body>
                <Grupos
                  categorias={categorias}
                  facetas={facetas}
                  filtros={borrador}
                  onCategoria={(cat) => setBorrador((b) => conCambios(b, { cat }))}
                  onGrupo={(g, s) => setBorrador((b) => conGrupo(b, g, s))}
                />
              </Drawer.Body>
              <Drawer.Footer className="flex gap-2">
                <Button variant="ghost" onPress={() => setBorrador({ ...borrador, cat: null, etiquetas: {}, pagina: 1 })}>
                  Limpiar
                </Button>
                <Button
                  fullWidth
                  onPress={() => {
                    setAbierto(false);
                    navegar(borrador);
                  }}
                >
                  Ver resultados
                </Button>
              </Drawer.Footer>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </div>
    </>
  );
}
