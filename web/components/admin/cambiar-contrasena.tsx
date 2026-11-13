"use client";

import { Button, Description, Form, Input, Label, TextField, toast } from "@heroui/react";
import { useState, useTransition } from "react";
import { cambiarContrasena } from "@/app/admin/(panel)/ajustes/contrasena/acciones";

export function CambiarContrasena() {
  const [pendiente, iniciar] = useTransition();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetida, setRepetida] = useState("");

  return (
    <Form
      className="flex max-w-md flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        iniciar(async () => {
          const r = await cambiarContrasena({ actual, nueva, repetida });
          if (!r.ok) return void toast.danger(r.error);
          toast.success("Listo: tu contraseña nueva ya vale para el próximo ingreso.");
          setActual("");
          setNueva("");
          setRepetida("");
        });
      }}
    >
      <TextField isRequired type="password" value={actual} onChange={setActual} autoComplete="current-password">
        <Label>Contraseña actual</Label>
        <Input />
      </TextField>
      <TextField isRequired type="password" value={nueva} onChange={setNueva} minLength={8} autoComplete="new-password">
        <Label>Contraseña nueva</Label>
        <Input />
        <Description>Al menos 8 caracteres.</Description>
      </TextField>
      <TextField isRequired type="password" value={repetida} onChange={setRepetida} autoComplete="new-password">
        <Label>Repetí la contraseña nueva</Label>
        <Input />
      </TextField>
      <Button type="submit" isPending={pendiente} className="self-start">
        Cambiar contraseña
      </Button>
    </Form>
  );
}
