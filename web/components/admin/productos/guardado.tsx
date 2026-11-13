"use client";

import { CircleCheck } from "@gravity-ui/icons";
import { Button, toast } from "@heroui/react";
import { useRouter } from "next/navigation";
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

// Un solo "Guardar" para toda la edición de un producto. Cada sección (datos, bases,
// descripción) sigue con su propia Server Action, pero no tiene botón: se registra acá
// con useSeccionGuardable y avisa si tiene cambios. La barra de abajo guarda las que
// cambiaron, en orden, y frena en la primera que falla. Las fotos no pasan por acá: se
// guardan al subirlas. Ver claude/web/dashboard.md#guardado-único

type Guardar = () => Promise<boolean>;
type Contexto = {
  registrar: (id: string, orden: number, guardar: Guardar) => () => void;
  marcar: (id: string, sucio: boolean) => void;
};

const Guardado = createContext<Contexto | null>(null);

// El precio que se está escribiendo en "Nombre y precio", para que las bases muestren
// "vacío = $ X" con el valor de ahora y no con el último guardado. Contexto aparte: si
// fuera parte de Guardado, cada tecla re-registraría todas las secciones.
const PrecioEnVivo = createContext<{ precio: number | null; fijar: (p: number) => void }>({ precio: null, fijar: () => {} });

export const usePrecioEnVivo = () => use(PrecioEnVivo);

export function ProveedorGuardado({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const secciones = useRef(new Map<string, { orden: number; guardar: Guardar }>());
  const [sucias, setSucias] = useState<ReadonlySet<string>>(new Set());
  const [pendiente, iniciar] = useTransition();
  const [precio, setPrecio] = useState<number | null>(null);
  const precioEnVivo = useMemo(() => ({ precio, fijar: setPrecio }), [precio]);

  const registrar = useCallback((id: string, orden: number, guardar: Guardar) => {
    secciones.current.set(id, { orden, guardar });
    return () => void secciones.current.delete(id);
  }, []);
  const marcar = useCallback(
    (id: string, sucio: boolean) =>
      setSucias((s) => {
        if (s.has(id) === sucio) return s;
        const n = new Set(s);
        if (sucio) n.add(id);
        else n.delete(id);
        return n;
      }),
    [],
  );

  // Estable: si cambiara en cada render, los efectos de las secciones se re-ejecutarían
  // (marcar → render → valor nuevo → marcar…) y la página entra en un bucle.
  const valor = useMemo(() => ({ registrar, marcar }), [registrar, marcar]);

  // Cerrar la pestaña o recargar con cambios sin guardar: el navegador pregunta.
  const hayCambios = sucias.size > 0;
  useEffect(() => {
    if (!hayCambios) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [hayCambios]);

  function guardarTodo() {
    iniciar(async () => {
      const pendientes = [...secciones.current.entries()]
        .filter(([id]) => sucias.has(id))
        .sort(([, a], [, b]) => a.orden - b.orden);
      for (const [, s] of pendientes) if (!(await s.guardar())) return;
      toast("Cambios guardados");
      router.refresh();
    });
  }

  return (
    <Guardado value={valor}>
      <PrecioEnVivo value={precioEnVivo}>{children}</PrecioEnVivo>
      {/* Fija abajo: en el celular el botón queda siempre a mano del pulgar. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1800px] items-center justify-end gap-3 px-4 py-3 sm:px-6">
          <p aria-live="polite" className="flex items-center gap-2 text-sm text-muted">
            {hayCambios ? (
              <>
                <span aria-hidden className="size-2 rounded-full bg-dorado" />
                Tenés cambios sin guardar
              </>
            ) : (
              <>
                <CircleCheck aria-hidden className="size-4 text-celeste-oscuro" />
                Todo guardado
              </>
            )}
          </p>
          <Button isPending={pendiente} isDisabled={!hayCambios} onPress={guardarTodo}>
            Guardar cambios
          </Button>
        </div>
      </div>
    </Guardado>
  );
}

/**
 * Registra una sección en el guardado único. `guardar` devuelve si salió bien (y ya
 * mostró su error si no). Devuelve `true` si hay proveedor: la sección esconde su botón.
 * Sin proveedor (otras pantallas que reusan el componente) no hace nada.
 */
export function useSeccionGuardable(id: string, orden: number, sucio: boolean, guardar: Guardar): boolean {
  const ctx = use(Guardado);
  const ultimo = useRef(guardar);
  useEffect(() => {
    ultimo.current = guardar;
  });
  useEffect(() => ctx?.registrar(id, orden, () => ultimo.current()), [ctx, id, orden]);
  useEffect(() => {
    ctx?.marcar(id, sucio);
  }, [ctx, id, sucio]);
  useEffect(() => () => ctx?.marcar(id, false), [ctx, id]);
  return ctx !== null;
}
