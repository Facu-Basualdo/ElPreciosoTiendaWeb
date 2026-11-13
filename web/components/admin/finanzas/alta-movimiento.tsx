"use client";

import { Plus } from "@gravity-ui/icons";
import { Button, Form, Input, Label, ListBox, NumberField, Select, TextField, toast, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { crearMovimiento } from "@/app/admin/(panel)/finanzas/acciones";
import { CATEGORIAS, MEDIOS, type Medio, type TipoMovimiento } from "@/lib/admin/finanzas";
import { SITIO } from "@/lib/sitio";

const formatoPrecio = { style: "currency", currency: SITIO.moneda, maximumFractionDigits: 0 } as const;

/** Carga rápida de un gasto (o una venta fuera de la web): pensada para el celular. */
// `hoy` viene del servidor: calcular la fecha al renderizar un client component rompe
// el prerender de Cache Components.
export function AltaMovimiento({ hoy }: { hoy: string }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [tipo, setTipo] = useState<TipoMovimiento>("gasto");
  const [monto, setMonto] = useState<number>(Number.NaN);
  const [categoria, setCategoria] = useState<string>("materiales");
  const [medio, setMedio] = useState<Medio>("efectivo");
  const [fecha, setFecha] = useState(hoy);
  const [nota, setNota] = useState("");

  const cambiarTipo = (t: TipoMovimiento) => {
    setTipo(t);
    setCategoria(Object.keys(CATEGORIAS[t])[0]);
  };

  return (
    <Form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        iniciar(async () => {
          const r = await crearMovimiento({ tipo, monto, categoria, medio, fecha, nota });
          if (!r.ok) return void toast.danger(r.error);
          toast.success(tipo === "gasto" ? "Gasto cargado" : "Ingreso cargado");
          setMonto(Number.NaN);
          setNota("");
          router.refresh();
        });
      }}
    >
      <ToggleButtonGroup
        aria-label="Tipo de movimiento"
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[tipo]}
        onSelectionChange={(k) => cambiarTipo([...k][0] as TipoMovimiento)}
        className="sm:col-span-2"
      >
        <ToggleButton id="gasto">Gasto</ToggleButton>
        <ToggleButton id="ingreso">Ingreso fuera de la web</ToggleButton>
      </ToggleButtonGroup>

      <NumberField isRequired value={monto} onChange={(v) => setMonto(v ?? Number.NaN)} minValue={1} formatOptions={formatoPrecio}>
        <Label>Monto</Label>
        <NumberField.Group>
          <NumberField.Input inputMode="numeric" />
        </NumberField.Group>
      </NumberField>

      <TextField isRequired type="date" value={fecha} onChange={setFecha}>
        <Label>Fecha</Label>
        <Input />
      </TextField>

      <Select value={categoria} onChange={(v) => typeof v === "string" && setCategoria(v)}>
        <Label>Categoría</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {Object.entries(CATEGORIAS[tipo]).map(([id, nombre]) => (
              <ListBox.Item key={id} id={id} textValue={nombre}>
                {nombre}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <Select value={medio} onChange={(v) => typeof v === "string" && setMedio(v as Medio)}>
        <Label>Medio</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {Object.entries(MEDIOS).map(([id, nombre]) => (
              <ListBox.Item key={id} id={id} textValue={nombre}>
                {nombre}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <TextField value={nota} onChange={setNota} maxLength={200} className="sm:col-span-2">
        <Label>Nota (opcional)</Label>
        <Input placeholder={tipo === "gasto" ? "Cintas celestes x 10 m" : "Feria del 25 de Mayo"} />
      </TextField>

      <div className="flex justify-end sm:col-span-2">
        <Button type="submit" isPending={pendiente}>
          <Plus />
          {tipo === "gasto" ? "Cargar gasto" : "Cargar ingreso"}
        </Button>
      </div>
    </Form>
  );
}
