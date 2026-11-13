import { ZONA } from "@/lib/admin/fechas";
import type { Database } from "@/lib/supabase/database.types";
import type { supabaseServidor } from "@/lib/supabase/servidor";
import { Seccion } from "../seccion";

// Últimos movimientos de stock del producto. Los escribe un trigger en cada cambio de
// stock, venga de donde venga. Ver claude/supabase/variantes-y-stock.md#historial-de-stock

const MOTIVOS: Record<Database["public"]["Enums"]["motivo_stock"], string> = {
  alta: "Alta",
  ajuste: "Ajuste",
  ingreso: "Ingreso de mercadería",
  pedido: "Pedido",
};
const fecha = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short", timeZone: ZONA });
const LIMITE = 30;
type Cliente = Awaited<ReturnType<typeof supabaseServidor>>;

export async function HistorialStock({
  supabase,
  productoId,
  nombres,
}: {
  supabase: Cliente;
  productoId: string;
  /** variante_id → "M / Negro" (las que ya no existen se muestran como «Variante borrada»). */
  nombres: Map<string, string>;
}) {
  const { data, error } = await supabase
    .from("movimientos_stock")
    .select("id, variante_id, cantidad, stock_resultante, motivo, detalle, usuario_id, creado_en")
    .eq("producto_id", productoId)
    .order("creado_en", { ascending: false })
    .order("id", { ascending: false })
    .limit(LIMITE);

  const usuarios = [...new Set((data ?? []).map((m) => m.usuario_id).filter((u): u is string => !!u))];
  const { data: personas } = usuarios.length
    ? await supabase.from("staff").select("user_id, nombre").in("user_id", usuarios)
    : { data: [] };
  const quien = new Map((personas ?? []).map((p) => [p.user_id, p.nombre]));

  return (
    <Seccion
      id="historial-stock"
      titulo="Historial de stock"
      descripcion={`Cada cambio de stock queda registrado: pedidos y ajustes. Últimos ${LIMITE}.`}
    >
      {error ? (
        <p className="text-danger">No se pudo leer el historial.</p>
      ) : !data.length ? (
        <p className="text-sm text-muted">Todavía no hay movimientos.</p>
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <div role="list" className="flex min-w-[640px] flex-col divide-y divide-separator rounded-xl border border-border text-sm">
            <div className="grid grid-cols-[8.5rem_1fr_4rem_4rem_1.4fr] gap-3 bg-surface-secondary px-3 py-2 text-xs font-medium text-muted">
              <span>Fecha</span>
              <span>Variante</span>
              <span className="text-right">Cambio</span>
              <span className="text-right">Quedó</span>
              <span>Motivo</span>
            </div>
            {data.map((m) => (
              <div role="listitem" key={m.id} className="grid grid-cols-[8.5rem_1fr_4rem_4rem_1.4fr] items-baseline gap-3 px-3 py-2">
                <span className="text-muted tabular-nums">{fecha.format(new Date(m.creado_en))}</span>
                <span>{(m.variante_id && nombres.get(m.variante_id)) ?? "Variante borrada"}</span>
                <span className="text-right font-medium tabular-nums">
                  {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                </span>
                <span className="text-right tabular-nums">{m.stock_resultante}</span>
                <span>
                  {MOTIVOS[m.motivo]}
                  {(m.detalle || (m.usuario_id && quien.get(m.usuario_id))) && (
                    <span className="block text-xs text-muted">
                      {[m.detalle, m.usuario_id && quien.get(m.usuario_id)].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Seccion>
  );
}
