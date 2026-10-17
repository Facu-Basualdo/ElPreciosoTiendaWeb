"use client";

import { Label, ListBox, Select } from "@heroui/react";
import { ROLES, type RolStaff } from "@/lib/admin/staff";

export function SelectorRol({
  valor,
  onChange,
  etiqueta = "Rol",
  oculta = false,
  isDisabled,
}: {
  valor: RolStaff;
  onChange: (rol: RolStaff) => void;
  etiqueta?: string;
  /** Sin etiqueta visible (en el listado). */
  oculta?: boolean;
  isDisabled?: boolean;
}) {
  return (
    <Select
      value={valor}
      isDisabled={isDisabled}
      onChange={(v) => {
        const rol = ROLES.find((r) => r.id === v);
        if (rol) onChange(rol.id);
      }}
    >
      <Label className={oculta ? "sr-only" : undefined}>{etiqueta}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {ROLES.map((r) => (
            <ListBox.Item key={r.id} id={r.id} textValue={r.nombre}>
              {r.nombre}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
