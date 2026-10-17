"use client";

import { TrashBin } from "@gravity-ui/icons";
import { AlertDialog, Button, Chip, Switch, toast } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cambiarActivo, cambiarRol, quitarPersona } from "@/app/admin/(panel)/usuarios/acciones";
import type { PersonaStaff, RolStaff } from "@/lib/admin/staff";
import { SelectorRol } from "./selector-rol";

// Lista y no Table: la Table de HeroUI es un grid de React Aria que captura flechas y
// espacio, y pelea con el Select de cada fila (igual que el editor de variantes).
export function ListaPersonal({ personas, yo }: { personas: PersonaStaff[]; yo: string | undefined }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [quitar, setQuitar] = useState<PersonaStaff | null>(null);

  const ejecutar = (accion: () => Promise<{ ok: boolean; error?: string }>, exito: string) =>
    iniciar(async () => {
      const r = await accion();
      if (!r.ok) toast.danger(r.error ?? "No se pudo guardar.");
      else toast(exito);
      router.refresh();
    });

  return (
    <div role="list" aria-label="Personal" className="flex flex-col divide-y divide-separator rounded-tarjeta border border-border bg-surface">
      {personas.map((p) => {
        const esYo = p.email === yo;
        return (
          <div role="listitem" key={p.userId} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
            <div className="min-w-48 flex-1">
              <p className="flex items-center gap-2 font-medium">
                {p.nombre}
                {esYo && (
                  <Chip size="sm" variant="secondary">
                    Vos
                  </Chip>
                )}
                {!p.activo && (
                  <Chip size="sm" variant="tertiary">
                    Sin acceso
                  </Chip>
                )}
              </p>
              <p className="text-sm text-muted">{p.email}</p>
            </div>
            <div className="w-44">
              <SelectorRol
                oculta
                etiqueta={`Rol de ${p.nombre}`}
                valor={p.rol}
                isDisabled={pendiente}
                onChange={(rol: RolStaff) => ejecutar(() => cambiarRol(p.userId, rol), `${p.nombre}: rol cambiado`)}
              />
            </div>
            <Switch
              size="sm"
              isSelected={p.activo}
              isDisabled={pendiente}
              onChange={(activo) =>
                ejecutar(() => cambiarActivo(p.userId, activo), activo ? `${p.nombre} puede entrar` : `${p.nombre} ya no puede entrar`)
              }
            >
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <span className="text-sm">Puede entrar</span>
              </Switch.Content>
            </Switch>
            <Button isIconOnly size="sm" variant="ghost" aria-label={`Quitar a ${p.nombre}`} onPress={() => setQuitar(p)}>
              <TrashBin />
            </Button>
          </div>
        );
      })}

      <AlertDialog.Backdrop isOpen={!!quitar} onOpenChange={(abierto) => !abierto && setQuitar(null)}>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>¿Quitar a {quitar?.nombre}?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              Deja de poder entrar al panel y a la caja. Su cuenta no se borra: si compra en la tienda, sigue pudiendo
              hacerlo. Para un descanso temporal, mejor apagá «Puede entrar».
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant="ghost" onPress={() => setQuitar(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                isPending={pendiente}
                onPress={() => {
                  if (!quitar) return;
                  const p = quitar;
                  iniciar(async () => {
                    const r = await quitarPersona(p.userId);
                    if (!r.ok) return void toast.danger(r.error);
                    setQuitar(null);
                    toast(`${p.nombre} ya no es parte del personal`);
                    router.refresh();
                  });
                }}
              >
                Quitar
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </div>
  );
}
