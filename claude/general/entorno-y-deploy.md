# Entorno y deploy

[← CLAUDE.md](../../CLAUDE.md)

## Variables de entorno

Todas en `web/.env` (ignorado por git; el molde es `web/.env.example`).

| Variable | Vercel | Para qué |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL del proyecto. También arma `images.remotePatterns` en `next.config.ts` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sí | Key pública (`sb_publishable_…`). Viaja al navegador por diseño: la protección son grants + RLS |
| `NEXT_PUBLIC_SITIO_URL` | Sí (Production) | URL canónica: metadata, Open Graph, sitemap, robots, JSON-LD, links de WhatsApp. Sin ella todo apunta a `localhost:3000` |
| `NEXT_PUBLIC_WHATSAPP` | Opcional | Número para los pedidos, internacional sin `+`. Sin ella se usa el de El Precioso de `lib/sitio.ts`: sirve para probar con otro número |
| `DATABASE_URL` | **No** | Sólo la CLI de Supabase en local (migraciones, tipos, advisors). Session pooler, **puerto 5432**: la que copia el dashboard por defecto suele ser la de 6543 (transaction), que la CLI no soporta |
| `SUPABASE_SECRET_KEY` | **No** | Sólo el script local `crear-admin.mjs`. **La app no la importa** |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | **No** | Credenciales del admin que escribe `crear-admin.mjs`. Sólo referencia local |
| `PRUEBA_EMAIL`, `PRUEBA_PASSWORD` | **No** | Usuario logueado sin permisos (`crear-admin.mjs … --sin-permisos`). Lo usa `auditar-permisos.mjs` |

**Si alguien necesita `SUPABASE_SECRET_KEY` en código de la app "para que funcione",
está tapando un grant o una policy faltante** — ver
[seguridad-rls](../supabase/seguridad-rls.md).

`web/.env` no se carga con `source` en bash: ver
[migraciones](../supabase/migraciones.md#conexión).

## Vercel

- **Root Directory: `web`.** El repo tiene `supabase/`, `claude/`, `docs/` al lado; si el
  root queda en la raíz, Vercel no encuentra `package.json`.
- Framework Next.js, build y output por defecto. Variables de la tabla (las que dicen Sí).
- Plan Hobby: la optimización de imágenes tiene cupo mensual. Por eso las imágenes se
  suben ya en tamaño final y hay pocas variantes de `sizes` (ver
  [imagenes](../web/imagenes.md)).

## Supabase

- **Un solo proyecto, que es el de producción** (datos reales de la tienda). Tiene
  aplicado el seed de taxonomía (ver [migraciones](../supabase/migraciones.md#seed)).
  **Un admin probando en un preview o en local escribe en prod**: para pruebas que
  ensucian, crear otro proyecto de desarrollo y apuntar ahí los previews.
- **Auth → URL Configuration**: agregar el dominio de producción y el patrón de los
  previews en Redirect URLs, si no el login desde un preview redirige mal.
- **Auth → Sign-ups deshabilitados**: la tienda no tiene cuentas de clientes. Las cuentas
  del personal se crean con el script (ver
  [seguridad-rls](../supabase/seguridad-rls.md#alta-de-personal)).
- Plan gratuito: el proyecto se pausa tras una semana sin actividad. Con la tienda en
  uso no pasa; en temporada baja, entrar al dashboard de vez en cuando o usar un plan pago.

## Orden de un deploy con cambio de esquema

El build de Vercel **no aplica migraciones**. Si se mergea código que lee una columna
nueva antes de aplicar la migración, producción rompe hasta que alguien la aplique.

1. `supabase db push` (ver [migraciones](../supabase/migraciones.md#flujo)).
2. Regenerar `database.types.ts` y commitearlo con el código.
3. Recién después, merge a `main` → deploy.

Las migraciones tienen que ser compatibles con el código que está corriendo (agregar
columna nullable → desplegar → recién ahí volverla `not null`).

## Ver también

- [Arquitectura](arquitectura.md)
- [Migraciones](../supabase/migraciones.md)
- [Clientes de Supabase](../web/clientes-supabase.md)
