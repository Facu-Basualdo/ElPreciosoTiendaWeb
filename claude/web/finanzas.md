# Finanzas

[← Índice web](INDICE.md)

`/admin/finanzas` (`app/admin/(panel)/finanzas/`, componentes en
`components/admin/finanzas/`): cuánto entró, cuánto salió y qué se vendió, por mes. Los
totales los calcula la base (`finanzas_por_mes`, ver
[supabase](../supabase/finanzas.md)); la página sólo resta ingresos menos gastos para
las cifras de arriba.

## Pantalla

| Parte | Detalle |
|---|---|
| Mes | `?mes=YYYY-MM` (por defecto el actual en Argentina), flechas anterior/siguiente. `lib/admin/finanzas.ts` arma rangos y nombres |
| Cifras | Ingresos (pedidos entregados + fuera de la web), gastos y resultado (ingresos − gastos) |
| Últimos 12 meses | `GraficoMeses`: barras de ingresos y gastos, un solo eje en pesos, tooltip con hover o foco, tabla con los mismos números en un `Disclosure` |
| Cargar gasto o ingreso | `AltaMovimiento`: tipo, monto, fecha, categoría (cambia según el tipo), medio, nota |
| Más vendidos | `finanzas_mas_vendidos` de los últimos 12 meses |
| Movimientos del mes | Lista con borrar (con confirmación) y **Exportar CSV** |

## Lo que no es obvio

- **Los pedidos entregados no se cargan a mano**: ya suman solos. El alta es para lo que
  pasa fuera de la web (feria, venta en mano) y los gastos.
- **Colores del gráfico**: azul `#2f6fb0` (ingresos) y dorado `#c98a12` (gastos), más
  profundos que los de la marca porque los originales no pasan el validador de dataviz
  (el dorado de la marca es muy claro, el celeste oscuro muy gris). El dorado no llega a
  3:1 contra el blanco: por eso la tabla está siempre a mano.
- **`AltaMovimiento` recibe `hoy` del servidor.** Calcular `new Date()` al renderizar un
  client component rompe el prerender con Cache Components ("unstable value").
- **El CSV es para el Excel en español**: separador `;` y BOM UTF-8. Se arma en el
  navegador con los datos que ya trajo la página: no hay route handler.
- **El costo por base no se carga desde el panel** (la dueña no lo usa): la columna y la
  cifra "Ganancia estimada" se sacaron. La base sigue guardando el costo si existe
  (`costos_variante`, `costo_vendido` en `finanzas_por_mes`): volver a mostrarlo es sólo UI.

## Ver también

- [Finanzas (supabase)](../supabase/finanzas.md)
- [Dashboard](dashboard.md)
- [Variantes y stock](variantes-y-stock.md)
