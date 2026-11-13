"use client";

import { Plus } from "@gravity-ui/icons";
import { Button, Description, Form, Input, Label, TextField, toast } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { agregarPersona } from "@/app/admin/(panel)/usuarios/acciones";
import { Seccion } from "../seccion";

/** Alta de personal: la persona ya tiene que tener cuenta con ese email. */
export function AgregarPersona() {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");

  return (
    <Seccion
      titulo="Agregar persona"
      descripcion="Usá el email de una cuenta que ya exista: la persona entra con su propia contraseña."
    >
      <Form
        className="grid items-start gap-4 md:grid-cols-[1.3fr_1fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          iniciar(async () => {
            const r = await agregarPersona({ email, nombre });
            if (!r.ok) return void toast.danger(r.error);
            toast.success(`${nombre.trim()} ya puede entrar`);
            setEmail("");
            setNombre("");
            router.refresh();
          });
        }}
      >
        <TextField isRequired type="email" value={email} onChange={setEmail}>
          <Label>Email</Label>
          <Input placeholder="nombre@ejemplo.com" />
        </TextField>
        <TextField isRequired value={nombre} onChange={setNombre} maxLength={80}>
          <Label>Nombre</Label>
          <Input placeholder="Juliana P." />
          <Description>Cómo aparece en el historial del panel.</Description>
        </TextField>
        <Button type="submit" isPending={pendiente} className="md:mt-6">
          <Plus />
          Agregar
        </Button>
      </Form>
    </Seccion>
  );
}
