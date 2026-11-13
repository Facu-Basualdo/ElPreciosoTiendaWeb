# Índice — web

Next.js 16 (App Router, Cache Components, TypeScript) · HeroUI v3 · Tailwind v4 ·
`@supabase/ssr` · TipTap v3 · Embla. Desplegado en Vercel con Root Directory `web`.

[← CLAUDE.md](../../CLAUDE.md)

## Protocolo de trabajo

Antes de tocar una pantalla, leé en este orden:

1. [heroui](heroui.md) — la v3 no es la v2 de internet; y
   [tema-y-marca](tema-y-marca.md) — paleta de El Precioso y qué color va dónde.
2. [clientes-supabase](clientes-supabase.md) — qué cliente corresponde según dónde corre el código.
3. [cache-y-revalidacion](cache-y-revalidacion.md) — si la pantalla lee catálogo o si muta algo.
4. La nota de la feature (tabla de abajo) y su par en [supabase](../supabase/INDICE.md).

Next 16 cambió APIs: antes de usar una, consultá `web/node_modules/next/dist/docs/`
(lo pide `web/AGENTS.md`). Con eso y las notas alcanza: **no lances agentes de
exploración** para reconstruir estos contratos.

## Fundamentos

| Nota | De qué trata |
|---|---|
| [HeroUI](heroui.md) | Es la v3: sin provider, componentes compuestos, sin `color` ni `as` · links internos = `next/link` + `linkVariants`/`buttonVariants` · `Link`/`Breadcrumbs` con `href` dependen del `RouterProvider` · `Pagination.Link` no tiene `href` · scroll con `ScrollShadow` o `scrollbar-thin`, nunca `overflow-auto` suelto · `Tabs` ocupa todo el ancho salvo `min-w-0` + `w-auto` · `Switch.Control` va dentro de `Switch.Content` o el switch no tiene input · no hay carrusel, editor, dropzone ni recorte |
| [Tema y marca](tema-y-marca.md) | Un solo tema claro (sin `next-themes`): marfil, azul noche, dorado = acción principal (un botón dorado por vista), celeste = acento y ahorro · el gris niebla de la marca no sirve para texto: `--muted` es `#5b6675` · paleta en `globals.css` sobre las variables de HeroUI, sin capa · Fraunces (`font-serif`) en títulos, Inter en texto · logo armado desde `SITIO.nombre` con la huella como "O" y `aria-label` · `contenedor` hasta 1800 px y grilla `auto-fill` de 15rem · links de WhatsApp con `enlaceWhatsapp` · la portada es el catálogo; la landing vive en `/nosotros` (hero con tres fotos fijas de `SITIO.portadaNosotros`, sin video) · las reseñas de la landing no se publican · encabezado: franja no fija + barra fija; `ENLACES` alimenta barra y menú del celular; la sección actual se marca sólo por ruta, con `usePathname` en `Suspense` |
| [Clientes de Supabase](clientes-supabase.md) | Tres clientes y cuándo va cada uno · cookies en una página pública la vuelven dinámica y rompen `'use cache'` · `getClaims()`, nunca `getSession()` · `proxy.ts` (no `middleware.ts`) sólo en `/admin` y copiando los headers de `setAll` |
| [Caché y revalidación](cache-y-revalidacion.md) | `'use cache'` + `cacheLife('max')` + `cacheTag` · args normalizados = clave estable · nada de `Date.now()` en funciones cacheadas · `updateTag` en cada Server Action · precios con vida de 5 min y tag `promociones` (las promos vencen sin mutar nada) · datos tocados por SQL/script NO invalidan nada y la caché sobrevive entre builds (`rm -rf .next`) |

## Features

| Nota | De qué trata |
|---|---|
| [Dashboard](dashboard.md) | Productos: secciones con su propio Guardar · pedidos: cada cambio de estado por `cambiar_estado_pedido` (confirmar descuenta, cancelar repone) e invalida las fichas · tabla de errores que ya pasaron (funciones a HeroUI desde el server, `usePathname` sin Suspense, filas editables en `Table`) · la guardia es UX, la seguridad es RLS · cada página lee la sesión dentro de SU PROPIO `<Suspense>`, nunca arriba (el del layout no cubre navegaciones) · login = `signInWithPassword` + `router.refresh()` · acciones devuelven `Resultado`, nunca lanzan ni redirigen · "Refrescar tienda" para cambios hechos por fuera · `crear-admin.mjs [--sin-permisos]` guarda la contraseña en `.env`, no la imprime · menú corto (Productos · Pedidos · Finanzas · Ajustes); promociones, combos y cupones sólo con `SITIO.ventasAvanzadas` · "Cargar fotos": una foto = un borrador · productos en grilla de tarjetas, no `Table` · inicio con accesos rápidos, pedidos para atender y borradores · panel hasta 1800 px · ficha corta con lo opcional plegado · sin stock en ningún lado del panel · pedidos: lista (no `Table`), toda la fila abre el detalle y el estado se cambia con un `Select` encima del link estirado, con "Deshacer" · Usuarios (personal por email, sin roles) · "Mi contraseña" en Ajustes pide la actual y la verifica con un cliente sin cookies · el admin nunca escribe slugs: los arma el servidor y quedan fijos al publicar · al cargar un producto se ven sólo los grupos de su categoría y sus plantillas (cambian al instante, sin guardar) |
| [Finanzas](finanzas.md) | Los totales los calcula la base (`finanzas_por_mes`) · los pedidos entregados suman solos, a mano sólo lo de fuera de la web · gráfico azul/dorado profundos (los de la marca no pasan el validador) con tabla siempre a mano · `AltaMovimiento` recibe `hoy` del servidor (Cache Components) · CSV con `;` y BOM para el Excel |
| [Banners](banners.md) | El id de un banner nuevo lo genera la página (las imágenes suben a `banners/{id}/` antes de la fila) · al guardar se borran los archivos que ya no usa · el color del texto es `texto_claro`, no la posición en el carrusel · `DiapositivaBanner` es la misma pieza en la home y en la vista previa |
| [Combos](combos.md) | Las líneas del carrito se identifican por `clave` (`claveItem`), no por variante · `/combos` aparte, nunca en `/catalogo` · la ficha reusa `obtenerProducto` con precio de lista y manda las variantes en el orden de los ítems · el selector evalúa el stock contra la cantidad del ítem · `GaleriaAdmin`/`EditorDescripcion` reciben acciones ligadas con `.bind` · lecturas con tag `combos` + `productos` |
| [Cupones](cupones.md) | El navegador guarda sólo el código (`carrito:cupon`) y nunca lee la tabla: si vale lo dice `cotizar_carrito` · un cupón inválido bloquea el envío · las acciones no invalidan caché · fechas con `lib/admin/fechas.ts` |
| [Promociones](promociones.md) | La web no calcula descuentos: tarjeta = `buscar_productos`, ficha = `precios_producto`, carrito = `cotizar` · tachado = el mayor entre lista y `precio_anterior` · toda lectura con precio lleva el tag `promociones` y vive 5 min (las fechas no invalidan nada) · se guarda con `guardar_promocion` (atómico) · fechas por día: `hasta` se guarda como las 24:00 de Argentina |
| [Carrito](carrito.md) | El navegador guarda sólo ids y cantidades; los precios los devuelve `cotizar_carrito`, nunca se suman acá · `localStorage` siempre en try/catch · tarjeta suma directo sólo con variante única · WhatsApp con link tocado, no `window.open` tras el `await` · el mensaje usa lo que devolvió `crear_pedido` |
| [Catálogo](catalogo.md) | `/ofertas` es ruta, no filtro (sería clave reservada) · siempre grilla (la vista en lista se sacó) · las páginas no esperan `params`/`searchParams`: los pasan a un hijo en `<Suspense>` · paginación OFFSET con `<a>` reales y vuelta a página 1 al filtrar · filtros = `noindex` · `notFound()` en streaming responde 200 a propósito · ficha: características una sola vez junto al precio, barra fija en el celular sólo con los botones fuera de pantalla, "Más modelos" por fecha patria completado con recientes |
| [Etiquetas y filtros](etiquetas.md) | Filtros en la URL como `?grupo=slug1,slug2` · `cat`, `q`, `orden`, `pagina` son claves reservadas · AND entre grupos, OR dentro · facetas del RPC, nunca contadas en el cliente · en el panel, renombrar cambia el slug y los duplicados se fusionan · toda acción invalida `etiquetas` + `facetas` + `productos` |
| [Variantes y stock](variantes-y-stock.md) | Nunca ocultar opciones: agotada = tachada y elegible, inexistente = deshabilitada · disponibilidad contra lo elegido en los otros grupos · variante en `?variante=` · "Sin stock" no oculta el producto, `publicado` sí · el editor manda el `stock_original` de cada fila y muestra el error de conflicto tal cual · historial de stock debajo · precio 0 = "Precio a consultar" + WhatsApp, nunca "$ 0" ni al carrito (`sinPrecio`, sólo interfaz) |
| [Imágenes](imagenes.md) | Relación fija con recorte obligatorio al subir (9:16 producto, 3:1 y 4:5 banner) · la galería de la ficha tiene ancho tope (`max-w-md`): 9:16 a media pantalla sería altísimo · subida directa a Storage (los Server Actions cortan en 1 MB) · UUID nuevo, nunca `upsert` · `sizes` siempre, pocas variantes · banner = dos `<Image>` por breakpoint |
| [Editor de fotos](editor-de-fotos.md) | Foto del celular → sin fondo → sobre la plantilla, en el navegador · `@imgly/background-removal` (AGPL: el repo tiene que seguir público) baja ~80 MB la primera vez y se importa con `import()` sólo en el editor · ajustes píxel por píxel porque Safari no tiene `ctx.filter` · slider de tamaño relativo a la zona libre · la vista previa es el lienzo real 1080×1920 · `plantilla.webp` se regenera desde `plantilla.png` |
| [Descripción rica](descripcion-rica.md) | JSON de TipTap, jamás HTML · al Server Action como STRING: los attrs de ProseMirror (`Object.create(null)`) no se serializan y las tablas fallan · editor y renderer comparten `extensiones.ts` o se pierde contenido · `immediatelyRender: false` · guardar también `descripcion_texto` · scroll de tablas vía `nodeMapping` |
