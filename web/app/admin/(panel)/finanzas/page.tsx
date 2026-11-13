import { ChevronLeft, ChevronRight } from "@gravity-ui/icons";
import { Skeleton } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import type { Metadata } from "next";
import NextLink from "next/link";
import { Suspense } from "react";
import { AltaMovimiento } from "@/components/admin/finanzas/alta-movimiento";
import { GraficoMeses } from "@/components/admin/finanzas/grafico-meses";
import { ExportarCsv, ListaMovimientos } from "@/components/admin/finanzas/lista-movimientos";
import { Seccion } from "@/components/admin/seccion";
import { finDia, inicioDia, aDia } from "@/lib/admin/fechas";
import { correrMes, etiquetaMes, hoy, mesElegido, rangoMes } from "@/lib/admin/finanzas";
import { requerirAdmin } from "@/lib/auth";
import { formatearPrecio } from "@/lib/formato";

export const metadata: Metadata = { title: "Finanzas" };

// Ingresos = pedidos ENTREGADOS (por fecha de entrega) + ingresos cargados a mano.
// Los totales los calcula la base (finanzas_por_mes). Ver claude/web/finanzas.md
export default function PaginaFinanzas(props: PageProps<"/admin/finanzas">) {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold tracking-tight">Finanzas</h1>
      <Suspense fallback={<Skeleton className="h-96 rounded-tarjeta" />}>
        <Contenido searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/admin/finanzas">["searchParams"] }) {
  const mes = mesElegido((await searchParams).mes);
  const { supabase } = await requerirAdmin();
  const { desde, hasta } = rangoMes(mes);
  const desdeAnio = rangoMes(correrMes(mes, -11)).desde;

  const [porMes, vendidos, movimientos, entregados] = await Promise.all([
    supabase.rpc("finanzas_por_mes", { p_desde: desdeAnio, p_hasta: hasta }),
    supabase.rpc("finanzas_mas_vendidos", { p_desde: desdeAnio, p_hasta: hasta, p_limite: 8 }),
    supabase
      .from("movimientos_dinero")
      .select("id, tipo, fecha, monto, categoria, medio, nota")
      .gte("fecha", desde)
      .lte("fecha", hasta)
      .order("fecha", { ascending: false })
      .order("id", { ascending: false }),
    supabase
      .from("pedidos")
      .select("numero, nombre, total, entregado_en")
      .eq("estado", "entregado")
      .gte("entregado_en", inicioDia(desde)!)
      .lt("entregado_en", finDia(hasta)!)
      .order("entregado_en"),
  ]);
  if (porMes.error || vendidos.error || movimientos.error || entregados.error) {
    return <p className="text-danger">No se pudieron leer las finanzas.</p>;
  }

  const meses = porMes.data.map((f) => ({
    mes: f.mes.slice(0, 7),
    ventas: Number(f.ventas),
    pedidos: f.pedidos,
    otros: Number(f.otros_ingresos),
    gastos: Number(f.gastos),
    costo: Number(f.costo_vendido),
    sinCosto: f.items_sin_costo,
  }));
  const actual = meses.find((m) => m.mes === mes) ?? { mes, ventas: 0, pedidos: 0, otros: 0, gastos: 0, costo: 0, sinCosto: 0 };
  const ingresos = actual.ventas + actual.otros;
  const resultado = ingresos - actual.gastos;
  const esMesActual = mes >= hoy().slice(0, 7);

  const listaMovimientos = movimientos.data.map((m) => ({ ...m, monto: Number(m.monto) }));
  const listaPedidos = entregados.data.map((p) => ({
    numero: p.numero,
    nombre: p.nombre,
    total: Number(p.total),
    fecha: aDia(p.entregado_en) ?? "",
  }));

  return (
    <>
      <nav aria-label="Mes" className="flex items-center gap-2">
        <NextLink href={`/admin/finanzas?mes=${correrMes(mes, -1)}`} aria-label="Mes anterior" className={buttonVariants({ isIconOnly: true, variant: "outline", size: "sm" })}>
          <ChevronLeft />
        </NextLink>
        <p className="min-w-40 text-center font-medium" aria-live="polite">
          {etiquetaMes(mes)}
        </p>
        {esMesActual ? (
          <span aria-hidden className={`${buttonVariants({ isIconOnly: true, variant: "outline", size: "sm" })} pointer-events-none opacity-40`}>
            <ChevronRight />
          </span>
        ) : (
          <NextLink href={`/admin/finanzas?mes=${correrMes(mes, 1)}`} aria-label="Mes siguiente" className={buttonVariants({ isIconOnly: true, variant: "outline", size: "sm" })}>
            <ChevronRight />
          </NextLink>
        )}
      </nav>

      <dl className="grid gap-3 sm:grid-cols-3">
        <Cifra
          titulo="Ingresos"
          valor={ingresos}
          detalle={`${actual.pedidos} ${actual.pedidos === 1 ? "pedido entregado" : "pedidos entregados"}${actual.otros ? ` + ${formatearPrecio(actual.otros)} fuera de la web` : ""}`}
        />
        <Cifra titulo="Gastos" valor={actual.gastos} detalle="Cargados a mano" />
        <Cifra titulo="Resultado" valor={resultado} detalle="Ingresos menos gastos" destacada />
      </dl>

      <Seccion titulo="Últimos 12 meses" descripcion="Pasá el dedo o el mouse por cada mes para ver el detalle.">
        <GraficoMeses filas={meses.map((m) => ({ mes: m.mes, ingresos: m.ventas + m.otros, gastos: m.gastos }))} />
      </Seccion>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_22rem]">
        <Seccion id="cargar" titulo="Cargar gasto o ingreso" descripcion="Los pedidos entregados ya cuentan solos: acá va lo que pasa fuera de la web.">
          <AltaMovimiento hoy={hoy()} />
        </Seccion>
        <Seccion titulo="Más vendidos" descripcion="Pedidos entregados en los últimos 12 meses.">
          {vendidos.data.length ? (
            <ol className="flex flex-col gap-2 text-sm">
              {vendidos.data.map((v, i) => (
                <li key={v.producto_id} className="flex items-center gap-3">
                  <span className="w-5 text-right tabular-nums text-muted">{i + 1}</span>
                  <NextLink href={`/admin/productos/${v.producto_id}`} className="flex-1 truncate hover:underline">
                    {v.nombre}
                  </NextLink>
                  <span className="tabular-nums text-muted">{v.unidades} u.</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted">Todavía no hay pedidos entregados.</p>
          )}
        </Seccion>
      </div>

      <Seccion
        titulo={`Movimientos de ${etiquetaMes(mes).toLowerCase()}`}
        acciones={<ExportarCsv mes={mes} pedidos={listaPedidos} movimientos={listaMovimientos} />}
      >
        <ListaMovimientos movimientos={listaMovimientos} />
      </Seccion>
    </>
  );
}

function Cifra({ titulo, valor, detalle, destacada = false }: { titulo: string; valor: number | null; detalle: string; destacada?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 rounded-tarjeta border p-5 ${destacada ? "border-transparent bg-encabezado text-encabezado-foreground" : "border-border bg-surface"}`}>
      <dt className={`text-sm ${destacada ? "text-white/70" : "text-muted"}`}>{titulo}</dt>
      <dd className="text-2xl font-semibold tabular-nums tracking-tight">{valor === null ? "—" : formatearPrecio(valor)}</dd>
      <dd className={`text-xs ${destacada ? "text-white/60" : "text-muted"}`}>{detalle}</dd>
    </div>
  );
}
