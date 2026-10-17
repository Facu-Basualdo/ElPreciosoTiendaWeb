import { Skeleton } from "@heroui/react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AgregarPersona } from "@/components/admin/usuarios/agregar-persona";
import { ListaPersonal } from "@/components/admin/usuarios/lista-personal";
import { ROLES } from "@/lib/admin/staff";
import { requerirAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Usuarios" };

// Shell estático + datos en su propio Suspense. Ver claude/web/dashboard.md#páginas-del-panel
export default function PaginaUsuarios() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
        <p className="text-sm text-muted">Quiénes entran a este panel y a la caja del local, y qué puede hacer cada uno.</p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-3">
        {ROLES.map((r) => (
          <div key={r.id} className="rounded-tarjeta border border-border bg-surface p-4">
            <dt className="font-medium">{r.nombre}</dt>
            <dd className="text-sm text-muted">{r.puede}</dd>
          </div>
        ))}
      </dl>
      <AgregarPersona />
      <Suspense fallback={<Skeleton className="h-48 rounded-tarjeta" />}>
        <Listado />
      </Suspense>
    </div>
  );
}

async function Listado() {
  const { supabase, email } = await requerirAdmin();
  const { data, error } = await supabase.from("staff").select("user_id, email, nombre, rol, activo").order("nombre");
  if (error) return <p className="text-danger">No se pudo leer el personal.</p>;
  const personas = data.map((p) => ({ userId: p.user_id, email: p.email, nombre: p.nombre, rol: p.rol, activo: p.activo }));
  return <ListaPersonal personas={personas} yo={email} />;
}
