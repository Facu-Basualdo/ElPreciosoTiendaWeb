# Plan — El Precioso

Documento de plan: se lee a demanda, no forma parte del grafo `claude/`. Lo construido
se documenta en `claude/`; acá queda el orden del trabajo y el diseño de lo que falta.

## Objetivo

Tienda de **El Precioso** (escarapelas y prendedores patrios artesanales, Resistencia,
Chaco) construida a partir de [CatalogoTienda](https://github.com/Facu-Basualdo/CatalogoTienda),
que sólo fue la base: este repo sigue por su cuenta y no se sincroniza con él. Reemplaza a la landing estática
[ElPrecioso](https://github.com/Facu-Basualdo/ElPrecioso) en el mismo proyecto de Vercel.

- Catálogo responsive (mobile first) con la identidad de la landing actual.
- Carrito que termina en un **mensaje de WhatsApp** con los productos elegidos.
- Dashboard **simple** para la dueña (no técnica, carga desde el celular).
- **Editor de fotos**: foto del celular → sin fondo → sobre la plantilla de marca.
- **Finanzas**: ingresos, gastos y ganancia.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Repo | `ElPreciosoTienda`, público, sólo la tienda web (sin el punto de venta de CatalogoTienda) |
| Fotos | Verticales 9:16 como las del celular (1080×1920), no 4:5. Las 99 actuales ya tienen la plantilla aplicada: se importan sin recorte |
| Stock | **A pedido**: no se controla stock. Flag por producto `a_pedido` (default true) por si alguno vuelve a tener stock |
| Precio por base | **Sí cambia**: la base es una variante con su propio precio |
| Ingresos | Cuenta un pedido cuando pasa a **entregado** |
| Nombres y precios | Los carga la dueña desde el panel (a coordinar con ella) |
| Vercel | Reemplaza el proyecto actual de la landing (Root Directory `web`) |
| Logo | Por ahora la palabra "EL PRECIOSO" con la O como huella de perro. Logo propio más adelante |
| Componentes | HeroUI para todo lo interactivo; Aceternity sólo decorativo en la tienda |

## Identidad

Tomada de la landing y de la plantilla (`web/public/marca/plantilla.png`):

| Token | Valor | Uso |
|---|---|---|
| Azul noche | `#0E1B2C` | Texto, encabezado, fondos profundos |
| Celeste bandera | `#74ACDF` | Acento patrio puntual, acuarela |
| Dorado sol | `#FCBF49` | Botón principal, precio, foco |
| Marfil | `#F7F5F0` | Fondo de página |
| Gris niebla | `#9CA3AF` | Texto secundario |

Fraunces (títulos) + Inter (texto) con `next/font`. Texturas de acuarela celeste y
dorada, trazos de dibujo (estrellas, sol) como detalle, nunca de fondo pesado. Rojo
sólo para errores. Reemplaza por completo la regla "blanco y negro tipo compragamer"
del upstream: hay que reescribir `CLAUDE.md` y `claude/web/tema-y-marca.md`.

### HeroUI + Aceternity

- **HeroUI v3**: botones, campos, selects, drawer del carrito, modales, tablas, todo el
  panel. Sigue la regla de no usar elementos nativos.
- **Aceternity UI** (copiar y pegar, usa `motion`): sólo en la tienda y en piezas
  decorativas — hero, carrusel de últimos ingresos, efecto en tarjetas, fondos.
  Se importan con `next/dynamic` o en client components hoja para no cargar `motion`
  en todo el sitio, y respetan `prefers-reduced-motion`.
- Medir con Lighthouse en mobile: LCP < 2,5 s en la home y la ficha.

## Fases

### 0 — Fork y entorno
- [x] Repo local, plantilla copiada a `web/public/marca/`.
- [ ] Repo en GitHub y primer push.
- [x] Proyecto Supabase nuevo, `web/.env`, `db push` (advisors sin problemas), tipos.
- [ ] Primer admin con `crear-admin.mjs` (necesita `SUPABASE_SECRET_KEY` en `web/.env`).
- [x] `seed.sql` sin datos de demo: categorías, grupos (Base como variante, Fecha patria,
      Dije, Colores) y sus etiquetas. Aplicado.
- [x] Poda: fuera `pos/`, su plan, sus notas, los scripts de demo y
      `plan-implementacion.md`. En la base, fuera `cajas`, los roles de staff y el código
      de barras: la migración `staff_y_stock` se reescribió antes del primer push (el
      proyecto estaba vacío). Todo el staff activo es admin; el historial de stock queda.
- [x] `lib/sitio.ts`: nombre, WhatsApp, Instagram, ciudad, horario. Falta la demora.
- [x] `CLAUDE.md` del repo reescrito.
- [x] Next 16.4.6 y Zod 4.6.7 (vulnerabilidades de `use cache` e imágenes en 16.3.7).

### 1 — Marca ✅
Hecha. Sin Aceternity por ahora: las manchas de acuarela son CSS y la home no necesitó
`motion`; queda disponible si hace falta un efecto. La imagen para compartir usa la
fuente por defecto de `next/og` (sin el peso 900 del logo): mejorarla en la fase 7.

- Paleta y tipografías en `globals.css` (variables de HeroUI incluidas).
- Encabezado liviano con carrito siempre visible en mobile; pie con Instagram y WhatsApp.
- **Home = la landing actual en Next**: hero con el video de la bandera
  (`bandera-web.webm`/`.mp4` + poster), problema/beneficios, últimos ingresos
  (productos más nuevos desde la base), catálogo, "Personalizá el tuyo", sobre nosotros,
  CTA de WhatsApp. Banners del panel opcionales debajo del hero.
- Las reseñas de la landing están ocultas y no son reales: **no se publican** hasta
  tener reseñas de verdad.
- Tarjeta de producto 9:16, nombre, precio "desde", botón Agregar.

### 2 — Catálogo para prendedores ✅
Hecha. "A pedido" se implementó con un trigger que fija el stock en 9999 (ver
`claude/supabase/variantes-y-stock.md#productos-a-pedido`) en vez de tocar cada función
que mira stock. Importados 97 borradores; los flyers son la 45 y la 46 (la 80 es un
producto). Pendiente con la dueña: nombre, categoría, bases y precio de cada modelo.

- **Categorías**: Escarapelas · Prendedores · Personalizados · Packs (colegios/mayorista).
- **Grupos de etiquetas**: Fecha patria (25 de Mayo, 20 de Junio, 9 de Julio,
  2 de Abril, Mundial), Dije (estrella, sol, Malvinas, guitarra, pava, Cabildo, corazón,
  paloma, pelota…), Colores.
- **Variante "Base"** con precio propio: alfiler gancho común · base gancho · alfiler
  de gancho grande · alfiler grande con cuelga dije · pin solapero pasante.
- **A pedido** (migración): `productos.a_pedido boolean not null default true`.
  `cotizar` no chequea stock para esos productos; confirmar/entregar no descuenta.
  El panel oculta el stock y la tienda muestra "Hecho a pedido · listo en N días".
- **Relación 9:16** en lugar de 4:5 para producto (recorte, `sizes`, placeholders).
- **Importación** (script local con la secret key, como el de demo): lee
  `../ElPrecioso/public/catalogo/`, convierte a WebP, sube a Storage y crea cada
  producto como **borrador** "Modelo Nº N". Las 79–99 (las de `ingresos/`, idénticas)
  con fecha más nueva. Las imágenes tipo flyer (varios prendedores + texto, ej. 45 y 80)
  no son productos: se marcan para revisar y van a banners o se descartan.

### 3 — Editor de fotos (en el panel) ✅
Hecho sin `react-konva`: gestos con pointer events sobre un canvas y ajustes píxel por
píxel (Safari no tiene `ctx.filter`). Probado con fotos reales: la organza translúcida
sobre fondo blanco se pierde en parte, la pantalla sugiere fondo oscuro. Detalle en
`claude/web/editor-de-fotos.md`.

Objetivo: que la dueña saque la foto del prendedor con el celular y quede como las de
referencia.

1. Elegir/sacar foto (`capture` en mobile).
2. **Quitar el fondo en el navegador** con `@imgly/background-removal` (WASM, sin
   costo por uso; licencia AGPL → compatible porque el repo es público). El modelo se
   descarga una vez y queda en caché. Fallback: subir la foto sin quitar fondo.
3. **Componer** sobre `plantilla.png` (1080×1920) en un canvas: el prendedor se
   ubica solo en la zona libre (aprox. x 8–92 %, y 36–86 %, entre bandera/logo y la
   moneda), escalado al ancho útil.
4. Ajustes táctiles: mover, pellizcar para escalar, rotar; brillo, contraste,
   saturación; sombra suave para que no parezca pegado. Probable `react-konva` por los
   transformadores táctiles.
5. Exportar WebP 1080×1920 y subir directo a Storage (mismo camino que la galería).
- La plantilla podría ser configurable más adelante (fechas: Mayo, Julio, Mundial).

### 4 — Dashboard simplificado ✅
Hecho. El interruptor es `SITIO.ventasAvanzadas`. Sin botón de chat con el cliente:
ver fase 5.

- Menú: **Productos · Pedidos · Finanzas · Ajustes** (categorías, etiquetas, banners,
  usuarios). Promociones, combos y cupones detrás de un interruptor en `sitio.ts`.
- **Carga rápida**: varias fotos → un borrador por foto. Ficha corta: foto, nombre,
  bases con precio, publicar. Descripción rica opcional y plegada.
- Pedidos: botón para abrir el chat de WhatsApp del cliente.
- Todo usable en el celular.

### 5 — Carrito y WhatsApp ✅
Hecho: mensaje con el tono de la marca. Se probó pedir WhatsApp y forma de entrega en el
carrito y se sacó: el pedido ya termina en el chat del cliente, ahí se arregla todo. Por
lo mismo, el panel no tiene botón "Abrir chat".

Ya existe. Ajustes:
- Mensaje con el tono de la marca: número de pedido, cantidad × modelo · base, total.
- Campo opcional de localidad / envío (retiro en Resistencia o envío al país).
- Precio mayorista posible con promociones por cantidad (si se habilitan).

### 6 — Finanzas ✅
Hecha. Tabla `movimientos_dinero` (no `movimientos`: ya existe `movimientos_stock`) y el
costo en `costos_variante` aparte, porque anon lee `producto_variantes` entera. Detalle
en `claude/supabase/finanzas.md` y `claude/web/finanzas.md`.

Migración nueva con grants, RLS y policies sólo admin en la misma migración.

- **Ingresos automáticos**: pedidos en estado `entregado` (fecha de entrega), sin
  cargarlos a mano.
- **`movimientos`** (manuales): `tipo` (gasto · ingreso), `fecha`, `monto numeric`,
  `categoria` (materiales, packaging, envíos, publicidad, otros · venta en mano,
  feria), `medio` (efectivo · transferencia), `nota`, `pedido_id` opcional.
- **Costo por variante** opcional, con snapshot en `pedido_items.costo_unitario` →
  ganancia estimada por pedido y por modelo. (Después se sacó del panel: la dueña no
  carga costos. La base lo sigue soportando.)
- Pantalla: resumen del mes (ingresos, gastos, ganancia), barras por mes (pico en
  Mayo), modelos más vendidos, alta rápida de gasto, exportar CSV.

### 7 — Producción
Hecho lo que no necesita cuentas: imagen para compartir con la bandera, sitemap sin
combos ni ofertas mientras `ventasAvanzadas` esté apagado, build de producción OK con
la base vacía. **Falta (lo hace el dueño de las cuentas):** repo en GitHub, repuntar
Vercel, URLs de Auth en Supabase, sign-ups cerrados, analytics y la prueba de punta a
punta desde el celular.

- Repuntar el proyecto de Vercel de la landing al repo nuevo. La landing queda en su
  repo como respaldo.
  1. **Root Directory `web`**.
  2. Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
     `NEXT_PUBLIC_SITIO_URL` (el dominio final) y `NEXT_PUBLIC_WHATSAPP`. Nada más (ver
     [entorno-y-deploy](../claude/general/entorno-y-deploy.md)).
  3. Supabase → Auth → URL Configuration: el dominio y el patrón de los previews.
  4. Supabase → Auth: deshabilitar sign-ups. Rotar la contraseña de la base.
- Open Graph con la plantilla/poster (sitemap y JSON-LD ya existen), analytics.
- Prueba de punta a punta desde el celular: catálogo → carrito → WhatsApp → pedido en
  el panel → entregado → finanzas.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Cupo de optimización de imágenes de Vercel Hobby | Imágenes en tamaño final, pocas variantes de `sizes` |
| Supabase gratuito pausa el proyecto tras una semana sin uso | Con la tienda en uso no pasa; si no, plan pago |
| Spam de pedidos anónimos | Límites en `crear_pedido`; Turnstile si hace falta |
| Precio mostrado ≠ precio cobrado | Motor único en Postgres (`cotizar`); el cliente sólo muestra |
| Modelo de fondo pesado en el editor de fotos | Se descarga una vez, sólo en el panel, con fallback sin quitar fondo |

## Pendiente de definir

- Nombres y precios de los modelos (con la dueña).
- Demora de fabricación y opciones de envío/retiro.
- Logo propio.
