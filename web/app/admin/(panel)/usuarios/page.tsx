import { Skeleton } from "@heroui/react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AgregarPersona } from "@/components/admin/usuarios/agregar-persona";
import { ListaPersonal } from "@/components/admin/usuarios/lista-personal";
import { requerirAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Usuarios" };

// Shell estático + datos en su propio Suspense. Ver claude/web/dashboard.md#páginas-del-panel
export default function PaginaUsuarios() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
        <p className="text-sm text-muted">Quiénes pueden entrar a este panel. Todos pueden hacer todo.</p>
      </div>
      <AgregarPersona />
      <Suspense fallback={<Skeleton className="h-48 rounded-tarjeta" />}>
        <Listado />
      </Suspense>
    </div>
  );
}

async function Listado() {
  const { supabase, email } = await requerirAdmin();
  const { data, error } = await supabase.from("staff").select("user_id, email, nombre, activo").order("nombre");
  if (error) return <p className="text-danger">No se pudo leer el personal.</p>;
  const personas = data.map((p) => ({ userId: p.user_id, email: p.email, nombre: p.nombre, activo: p.activo }));
  return <ListaPersonal personas={personas} yo={email} />;
}
