"use client";

import { Plus, TrashBin } from "@gravity-ui/icons";
import { AlertDialog, Button, Form, Input, Label, NumberField, Switch, TextField, toast } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { borrarCaja, cambiarActiva, crearCaja, guardarCaja } from "@/app/admin/(panel)/cajas/acciones";

export type CajaAdmin = { id: string; nombre: string; puntoVenta: number; activa: boolean };

/** Campos de una caja: los comparten el alta y cada fila. */
function Campos({
  nombre,
  puntoVenta,
  onNombre,
  onPuntoVenta,
  etiquetas,
}: {
  nombre: string;
  puntoVenta: number | null;
  onNombre: (v: string) => void;
  onPuntoVenta: (v: number | null) => void;
  etiquetas: boolean;
}) {
  return (
    <>
      <TextField isRequired aria-label={etiquetas ? undefined : "Nombre"} value={nombre} onChange={onNombre} maxLength={40} className="min-w-40 flex-1">
        {etiquetas && <Label>Nombre</Label>}
        <Input placeholder="Caja 1" />
      </TextField>
      <NumberField
        isRequired
        aria-label={etiquetas ? undefined : `Punto de venta de ${nombre}`}
        value={puntoVenta ?? Number.NaN}
        onChange={(v) => onPuntoVenta(v === undefined || Number.isNaN(v) ? null : Math.round(v))}
        minValue={1}
        maxValue={99998}
        formatOptions={{ useGrouping: false }}
        className="w-36"
      >
        {etiquetas && <Label>Punto de venta</Label>}
        <NumberField.Group>
          <NumberField.Input />
        </NumberField.Group>
      </NumberField>
    </>
  );
}

function AltaCaja({ siguiente }: { siguiente: number }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [nombre, setNombre] = useState("");
  const [puntoVenta, setPuntoVenta] = useState<number | null>(null);

  return (
    <Form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        iniciar(async () => {
          const r = await crearCaja({ nombre, puntoVenta: puntoVenta ?? siguiente });
          if (!r.ok) return void toast.danger(r.error);
          toast.success(`${nombre.trim()} creada`);
          setNombre("");
          setPuntoVenta(null);
          router.refresh();
        });
      }}
    >
      <Campos
        etiquetas
        nombre={nombre}
        puntoVenta={puntoVenta ?? siguiente}
        onNombre={setNombre}
        onPuntoVenta={setPuntoVenta}
      />
      <Button type="submit" isPending={pendiente}>
        <Plus />
        Agregar caja
      </Button>
    </Form>
  );
}

function FilaCaja({ caja }: { caja: CajaAdmin }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [nombre, setNombre] = useState(caja.nombre);
  const [puntoVenta, setPuntoVenta] = useState<number | null>(caja.puntoVenta);
  const [borrar, setBorrar] = useState(false);
  const cambiada = nombre.trim() !== caja.nombre || puntoVenta !== caja.puntoVenta;

  const ejecutar = (accion: () => ReturnType<typeof guardarCaja>, exito: string, despues?: () => void) =>
    iniciar(async () => {
      const r = await accion();
      if (!r.ok) return void toast.danger(r.error);
      despues?.();
      toast(exito);
      router.refresh();
    });

  return (
    <div role="listitem" className="flex flex-wrap items-center gap-3 px-4 py-3">
      <Campos nombre={nombre} puntoVenta={puntoVenta} onNombre={setNombre} onPuntoVenta={setPuntoVenta} etiquetas={false} />
      {cambiada && (
        <Button
          size="sm"
          isPending={pendiente}
          onPress={() => ejecutar(() => guardarCaja(caja.id, { nombre, puntoVenta: puntoVenta ?? 0 }), "Caja guardada")}
        >
          Guardar
        </Button>
      )}
      <Switch
        size="sm"
        isSelected={caja.activa}
        isDisabled={pendiente}
        onChange={(activa) => ejecutar(() => cambiarActiva(caja.id, activa), activa ? `${caja.nombre} activa` : `${caja.nombre} apagada`)}
      >
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <span className="text-sm">En uso</span>
        </Switch.Content>
      </Switch>
      <Button isIconOnly size="sm" variant="ghost" aria-label={`Borrar ${caja.nombre}`} onPress={() => setBorrar(true)}>
        <TrashBin />
      </Button>

      <AlertDialog.Backdrop isOpen={borrar} onOpenChange={setBorrar}>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>¿Borrar «{caja.nombre}»?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              Si ya cobró ventas no se puede borrar: apagá «En uso» y deja de aparecer en el programa de la caja.
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant="ghost" onPress={() => setBorrar(false)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                isPending={pendiente}
                onPress={() => ejecutar(() => borrarCaja(caja.id), "Caja borrada", () => setBorrar(false))}
              >
                Borrar
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </div>
  );
}

export function ListaCajas({ cajas }: { cajas: CajaAdmin[] }) {
  const siguiente = Math.max(0, ...cajas.map((c) => c.puntoVenta)) + 1;
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-4 rounded-tarjeta border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Nueva caja</h2>
          <p className="text-sm text-muted">
            El punto de venta es el número que diste de alta en ARCA para facturar desde esa caja. Cada caja usa uno distinto.
          </p>
        </div>
        <AltaCaja key={siguiente} siguiente={siguiente} />
      </section>

      {cajas.length === 0 ? (
        <p className="rounded-tarjeta border border-border bg-surface p-8 text-center text-muted">
          Todavía no hay cajas. Agregá una por cada computadora del local que cobra.
        </p>
      ) : (
        <div role="list" aria-label="Cajas" className="flex flex-col divide-y divide-separator rounded-tarjeta border border-border bg-surface">
          <div className="flex gap-3 px-4 pt-3 text-xs font-medium text-muted" aria-hidden>
            <span className="min-w-40 flex-1">Nombre</span>
            <span className="w-36">Punto de venta</span>
          </div>
          {cajas.map((c) => (
            <FilaCaja key={`${c.id}-${c.nombre}-${c.puntoVenta}`} caja={c} />
          ))}
        </div>
      )}
    </div>
  );
}
