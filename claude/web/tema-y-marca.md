# Tema y marca

[← Índice web](INDICE.md)

Identidad de **El Precioso**, tomada de la landing original y de la plantilla de las
fotos (`web/public/marca/plantilla.png`): página marfil, texto azul noche, dorado para
la acción principal y celeste como acento patrio. **Un solo tema, claro**: no hay modo
oscuro ni `next-themes`.

## Marca: un solo lugar

- `web/lib/sitio.ts` exporta `SITIO`: nombre, descripción, WhatsApp, Instagram, ciudad,
  horario y el interruptor `ventasAvanzadas`. **El nombre no se escribe literal en ningún
  otro archivo**: metadata, logo, pie, textos de la home y la imagen para compartir lo
  leen de ahí.
- `web/components/logo.tsx`: la palabra en mayúsculas muy pesadas con **la primera "O"
  después del espacio reemplazada por la huella** (`components/huella.tsx`), como en la
  plantilla. Se arma desde `SITIO.nombre`, con `role="img"` y `aria-label`: un lector de
  pantalla dice "El Precioso", no "EL PRECI SO". Todo en `currentColor`: sobre las franjas
  oscuras alcanza con el color del texto.
- `web/app/icon.svg`: huella azul noche sobre círculo dorado. `app/opengraph-image.tsx`:
  la bandera (`og-fondo.jpg`) con velo azul noche, el nombre con la huella y la frase.
  **`next/og` no lee WebP ni entiende `inset`**: el fondo es JPEG y las capas van con
  `top`/`left` y medidas; tampoco tiene el peso 900 del logo (sale en 700).
- Links a WhatsApp siempre con `enlaceWhatsapp(mensaje?)` (`lib/whatsapp.ts`).

## Dónde vive la paleta

**En `web/app/globals.css`, sobrescribiendo las variables de `@heroui/styles`** (que están
en `@layer base`; las nuestras van sin capa para ganarles). HeroUI activa el modo oscuro
sólo con la clase `.dark`: como nadie la pone, todo queda en claro. Las variables propias
se exponen a Tailwind en `@theme inline`.

| Variable / utilidad | Valor | Uso |
|---|---|---|
| `--noche` → `noche` | `#0e1b2c` | Texto (`--foreground`), franjas oscuras (`--encabezado`) |
| `--dorado` → `dorado` | `#fcbf49` | `--accent`: botón principal, contador del carrito, seleccionado, "Hacelo único" |
| `--celeste` → `celeste` | `#74acdf` | Acento patrio puntual, viñetas, manchas de acuarela, `--ahorro` |
| `--celeste-oscuro` | `#3a6f9f` | Celeste con contraste: antetítulos sobre marfil, íconos, `--focus` |
| `--marfil` → `marfil` | `#f7f5f0` | `--background`. **No es blanco**: el contenido va en superficies |
| `--muted` | `#5b6675` | Texto secundario. **El gris niebla `#9CA3AF` de la marca no llega a 4.5:1 sobre marfil**: no lo uses para texto |
| `--surface` → `bg-surface` | blanco | Tarjetas, paneles, filtros, carrito |
| `--encabezado` → `bg-encabezado` | azul noche | Pie, "Personalizá", encabezado del panel. Texto encima: `text-encabezado-foreground` (marfil) |
| `contenedor` (utilidad) | hasta 1800 px | Ancho de la tienda con margen `clamp()` (1440 dejaba mucho vacío en un monitor ancho). Encabezado, contenido y pie usan el mismo; el panel de admin usa `max-w-7xl`. La grilla del catálogo es `repeat(auto-fill, minmax(15rem, 1fr))` desde `sm`: suma columnas con el ancho en vez de cortar en 5 |
| `antetitulo` (utilidad) | | Etiqueta en versalitas espaciadas sobre los títulos ("ÚLTIMOS INGRESOS") |
| `--radio-tarjeta` → `rounded-tarjeta` | 1.25rem | Todo contenedor de página. Los controles usan `--radius` (0.75rem) |
| `--danger` | rojo | **Sólo errores** y acciones destructivas |

## Tipografía

`app/layout.tsx` carga con `next/font`: **Fraunces** (`font-serif`) para títulos y
**Inter** (`font-sans`) para el texto; Geist Mono sólo para SKUs. Los títulos de página
(`h1`) y de sección van en `font-serif` con peso normal; el nombre de la tarjeta de
producto también. El panel de admin sigue en Inter.

## Reglas

- **La tienda no enlaza a Instagram** (ni Contacto, ni pie, ni menú): se sacó a pedido. `SITIO.instagram` queda cargado pero sin usar.

- **Un botón dorado por vista**: "Agregar" en la tarjeta, "Ver catálogo" en el hero,
  "Enviar pedido" en el carrito. Lo demás `outline`, `ghost` o `secondary`.
- **Seleccionado = dorado.** HeroUI pinta el `ToggleButton` seleccionado con
  `--accent-soft` (15% del acento), que sobre marfil no se distingue; `globals.css` lo
  redefine a `--accent` en `.toggle-button`.
- El ahorro en pesos ("-$ 1.200", `ChipAhorro`) va en celeste con texto azul noche: es
  información, no decoración. Precio anterior tachado en `text-muted`.
- Acuarelas y trazos **sólo como detalle**: manchas `bg-celeste/35` y `bg-dorado/40` con
  `blur-3xl` detrás de un bloque, nunca de fondo de página ni detrás de texto largo.
- Sobre franjas oscuras: antetítulo en dorado, texto secundario `text-white/70`.
- Animaciones con `motion-reduce:` (el video del hero se oculta, el zoom del mosaico no
  corre).

## Nosotros

`/nosotros` ("Quiénes somos") es la landing de El Precioso pasada a Next
(`app/(tienda)/nosotros/page.tsx`, componentes en `components/tienda/inicio/`). La
portada es el catálogo. Cada sección tiene `id` (`sobre`, `trabajos`, `personaliza`,
`como-comprar`, `preguntas`, `contacto`) con `scroll-mt` para el encabezado fijo: el encabezado enlaza ahí.

| Sección | Datos |
|---|---|
| Hero | Fondo marfil: el texto de la marca y **tres fotos fijas**, la primera foto de los productos de `SITIO.portadaNosotros` (`obtenerFotosPortada`; escalonadas, con `priority`: son el LCP). **Fijas y no "los últimos"**: los recientes podían traer fotos mal encuadradas. Para cambiarlas se edita esa lista de slugs; un producto despublicado no aparece y con menos de tres queda sólo el texto. **Sin video**: la bandera de stock se sacó porque no mostraba el producto y pesaba 2–4 MB en el celular |
| Problema y beneficios | Textos fijos de la landing |
| Sobre nosotros | Historia, tres datos clave con ícono (hecho a mano, envíos y retiro, personalizados y por cantidad) y el porqué del nombre |
| Trabajos | Fotos de los últimos publicados, **sin repetir las del hero** (`obtenerRecientes(12)` menos los slugs de la portada; `components/tienda/inicio/mas-secciones.tsx`), link a cada ficha y al catálogo. Sin productos con foto, no aparece |
| Personalizá · Cómo comprar | Fijos. Las **bases** de "Personalizá" salen del grupo `base` (`obtenerValoresGrupo`) |
| Preguntas frecuentes | `Disclosure` por pregunta. **Sólo lo que la tienda ya sabe**: no nombra medios de pago ni plazos (la demora usa `SITIO.demoraDias` si está cargada) |
| Contacto | Botón de WhatsApp, horario, retiro y envíos |

**Las reseñas de la landing no se publican**: no eran reales. Vuelven cuando haya
reseñas de clientes de verdad.

## Encabezado

`components/tienda/encabezado.tsx`, en dos pisos:

| Piso | Qué tiene |
|---|---|
| Franja `bg-encabezado` (h-9, **no fija**: se va al bajar) | Hecho a mano en `SITIO.ciudad` · envíos y retiro · "Pedidos por WhatsApp" en dorado. En el celular, una sola línea corta |
| Encabezado fijo marfil (h-16) | Celular: menú · logo · lupa · carrito. `lg+`: secciones de `ENLACES` (`nav-principal.tsx`). `md+`: buscador. `xl+`: botón WhatsApp. El carrito suma el texto "Carrito" desde `md` |

**`ENLACES` es la única lista de secciones**: la usan la barra (`NavPrincipal`) y el
menú del celular (`MenuMovil`). Combos y Ofertas entran sólo con
`SITIO.ventasAvanzadas`. Las categorías no van acá: están en los filtros del catálogo.

**La sección actual se marca sólo por ruta** (subrayado dorado + `aria-current`): los
enlaces con `#` de `/nosotros` no se marcan nunca. `usePathname` va en `Suspense` con la
lista sin marcar de fallback, igual que el buscador con `searchParams`: si no, el layout
de la tienda deja de ser estático.

## Ver también

- [HeroUI](heroui.md#tema)
- [Catálogo](catalogo.md)
- [Carrito](carrito.md)
- [Variantes y stock](variantes-y-stock.md)
- [Banners](banners.md)
