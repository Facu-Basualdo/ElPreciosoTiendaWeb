# Finanzas

[← Índice supabase](INDICE.md)

Ingresos, gastos y ganancia de la tienda. Migración `*_finanzas.sql`. **Todo es sólo
admin**: tablas con grants a `authenticated` y RLS `es_admin()`, funciones que chequean
`es_admin()` adentro.

## De dónde sale cada número

| Número | Fuente |
|---|---|
| Ventas | `pedidos.total` de los pedidos en estado **`entregado`**, por **`entregado_en`** (no por `creado_en`) |
| Otros ingresos y gastos | `movimientos_dinero`, cargados a mano (feria, venta en mano, materiales…) |
| Costo de lo vendido | `pedido_items.costo_unitario × cantidad` de esos pedidos |

- **Un pedido cuenta como ingreso cuando se entrega.** `entregado_en` lo pone un
  trigger (`pedidos_entregado_en`, `before update of estado`) al pasar a `entregado`, y lo
  vuelve a `null` si sale de ese estado: un pedido que se "des-entrega" deja de sumar.
- **Los meses son de Argentina**: `entregado_en at time zone 'America/Argentina/Buenos_Aires'`.
  `movimientos_dinero.fecha` es `date` (el día que eligió la dueña), sin zona.

## Costo por variante

**Hoy el panel no lo edita ni lo muestra** (la dueña no lo usa). El editor no manda la
clave `costo`, así que guardar las bases no borra un costo que ya exista.

- **Tabla aparte, `costos_variante`** (`variante_id` pk → `producto_variantes`, cascade),
  y no una columna de `producto_variantes`: **anon puede leer `producto_variantes` entera**
  (grant de tabla), así que una columna `costo` saldría por la API pública.
- Se guarda con `guardar_variantes`: si una fila del JSON trae la clave `costo`, se
  guarda (`null` la borra); **una fila sin la clave no toca el costo**.
- **Snapshot en el pedido**: el trigger `pedido_items_costo` (definer, `before insert`)
  copia el costo vigente a `pedido_items.costo_unitario`. Cambiar el costo después no
  cambia la ganancia de pedidos viejos. Los ítems sin costo cargado quedan en `null` y
  `finanzas_por_mes` los cuenta en `items_sin_costo`.

## Tablas y funciones

| Objeto | Qué es |
|---|---|
| `movimientos_dinero` | `tipo` (`gasto` · `ingreso`), `fecha`, `monto > 0`, `categoria`, `medio` (`efectivo` · `transferencia`), `nota`, `pedido_id` opcional. Un `check` ata la categoría al tipo: gasto = materiales · packaging · envios · publicidad · otros; ingreso = venta_en_mano · feria · otros |
| `finanzas_por_mes(p_desde, p_hasta)` | Una fila por mes (aunque esté vacío): `ventas`, `pedidos`, `otros_ingresos`, `gastos`, `costo_vendido`, `items_sin_costo` |
| `finanzas_mas_vendidos(p_desde, p_hasta, p_limite)` | Productos por unidades entregadas; las hijas de un combo cuentan para su producto |

Nombre `movimientos_dinero` y no `movimientos` a secas: ya existe `movimientos_stock`.

## Ver también

- [Finanzas (web)](../web/finanzas.md)
- [Carrito y pedidos](carrito.md)
- [Variantes y stock](variantes-y-stock.md)
- [Seguridad y RLS](seguridad-rls.md)
