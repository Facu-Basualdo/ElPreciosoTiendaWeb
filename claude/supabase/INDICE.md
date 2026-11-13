# Índice — supabase

Postgres 17 · RLS · Storage · funciones RPC en SQL · Supabase CLI (vía `npx`).
Migraciones en `supabase/migrations/`, taxonomía inicial en `supabase/seed.sql`.

[← CLAUDE.md](../../CLAUDE.md)

## Protocolo de trabajo

Antes de escribir una migración, leé [esquema](esquema.md),
[seguridad-rls](seguridad-rls.md) y [migraciones](migraciones.md). Si toca etiquetas,
búsqueda, variantes o imágenes, además la nota del tema. **No lances agentes de
exploración** sobre `migrations/`: el estado vigente está resumido en
[esquema](esquema.md).

## Fundamentos

| Nota | De qué trata |
|---|---|
| [Esquema](esquema.md) | Tablas y relaciones · precios `numeric`, nunca `float` · `productos` no tiene stock: vive en `producto_variantes` · imágenes guardan `path`, no URL · `publicado` es la visibilidad · banners con ventana `desde/hasta` filtrada por `banners_vigentes()` · `staff` reemplazó a `admins` |
| [Seguridad y RLS](seguridad-rls.md) | Sin `grant` explícito la API da 42501 aunque RLS esté bien · anon nunca escribe (se revocó el default viejo) · estar logueado no da permisos: los da una fila ACTIVA en `staff` (sin roles: todo el staff es admin) · `private.es_admin()` definer, sólo `authenticated` · un trigger impide quedarse sin admin · `auditar-permisos.mjs` después de tocar policies · policies separadas por rol y por acción, nunca `for all` · RPC del catálogo `security invoker` |
| [Migraciones](migraciones.md) | `--db-url` al pooler 5432, no al 6543 · `db query` sobre el proyecto pide `--yes` (o `--read-only` para lecturas) · el seed es SQL a mano, sólo taxonomía · nunca `source web/.env` (imprime la contraseña) · nunca editar una aplicada · agregar un parámetro crea otra sobrecarga · regenerar tipos y advisors después de cada una |

## Features

| Nota | De qué trata |
|---|---|
| [Carrito y pedidos](carrito.md) | Un solo motor de precios `private.cotizar` para carrito, WhatsApp y pedido · chequea publicado/activa a mano porque corre dentro de un definer · sólo líneas `ok` suman · `crear_pedido` es la única escritura (anon sin grants) y sus errores se muestran al cliente · sin teléfono ni entrega: eso viene en el chat de WhatsApp que abre el cliente · el stock baja al confirmar, no al pedir |
| [Finanzas](finanzas.md) | Un pedido es ingreso al ENTREGARSE (`entregado_en` por trigger, null si sale del estado) · meses en hora de Argentina · costo en `costos_variante` aparte porque anon lee `producto_variantes` entera · `guardar_variantes` guarda el costo sólo si la fila trae la clave · snapshot `pedido_items.costo_unitario` por trigger · `movimientos_dinero` con categoría atada al tipo · todo sólo admin |
| [Combos](combos.md) | En el pedido, padre (precio) + una hija por variante (precio 0): así el stock se mueve sin tocar `cambiar_estado_pedido` · el carrito manda las variantes EN EL ORDEN de `combo_items` y se emparejan por posición · cada línea de `cotizar` trae `clave` (`combo:<id>:<variantes>`) · dentro del combo no hay promos · `producto_id` restrict: no se borra un producto que está en un combo |
| [Cupones](cupones.md) | Tabla SIN grants para anon: se evalúan en `evaluar_cupon` (definer, en `private`) · uno por pedido, sobre el subtotal después de promos · error genérico salvo el mínimo · `cotizar_carrito` y `crear_pedido` ganaron `p_cupon` (drop + create) · usos atómicos; cancelar devuelve el uso |
| [Promociones](promociones.md) | Sin alcance no aplica a nada: "todo" es `alcance_todo` explícito · no se acumulan: cada unidad recibe la que más descuenta, y una por cantidad (3x2, 2da al X%) se queda con las líneas sólo si gana más que las unitarias · N×M regala las unidades más baratas · `promociones_aplicables` filtra activa y fechas a mano (corre en el definer) · por etiqueta incluye las de variantes · `guardar_promocion` escribe promo + alcance en una transacción |
| [Variantes y stock](variantes-y-stock.md) | Todo producto tiene ≥ 1 variante (la "única" la crea un trigger) · talle/color van en `variante_etiquetas`, nunca en `producto_etiquetas` (trigger) · `talle=m & color=negro` exige UNA variante con stock que cumpla ambos · ordenar por `precio_desde` · se guarda sólo con `guardar_variantes`, que con `stock_original` no pisa un pedido confirmado mientras el panel estaba abierto · todo cambio de stock queda en `movimientos_stock` por trigger (motivo con `set_config('app.motivo_stock', …, true)`) · **a pedido** (`productos.a_pedido`, default true) = un trigger fija el stock en 9999, los pedidos no lo descuentan y no hay historial; 9999 nunca se muestra |
| [Etiquetas](etiquetas.md) | `categoria_grupos` guía qué grupos pide cada categoría en el panel, sin restringir nada en la base · La `clave` de las variantes la recalculan triggers al renombrar etiquetas o cambiar orden/slug de un grupo (si no, `guardar_variantes` recrea variantes con otro id) · `fusionar_etiquetas` junta duplicadas · Marca = grupo con `es_marca` (uno solo, nunca variante), no una columna · toda etiqueta pertenece a un grupo · `slug` es columna generada, nunca se escribe · `144Hz`/`144 hz` → `144-hz`, unique por grupo · slugs de grupo no pueden ser `cat/q/orden/pagina` · facetas sin el filtro de su propio grupo |
| [Búsqueda](busqueda.md) | `unaccent` no es inmutable: sin `f_unaccent` la columna generada no compila · se indexa `descripcion_texto`, no el JSON · etiquetas por join comparando texto y slug (`144hz` encuentra `144 Hz`) |
| [Imágenes](imagenes.md) | Relación fija: producto 9:16 (1080×1920, como el celular), banner 3:1 y 4:5 · `importar-catalogo.mjs` trae las fotos de la landing como borradores · sin texto dentro de la imagen · bucket público `catalogo`, escritura admin · path `productos/{id}/{uuid}.webp` · borrar la fila no borra el archivo · la secret key sólo la usa `crear-admin.mjs`, en local |
