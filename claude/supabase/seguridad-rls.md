# Seguridad y RLS

[← Índice supabase](INDICE.md)

La publishable key viaja en el bundle del navegador. Cualquiera puede usarla para
llamar a `https://<ref>.supabase.co/rest/v1/productos` directamente. **Lo único que
separa a un visitante de un admin son los grants y RLS.** El chequeo de `/admin` en el
proxy de Next es navegación, no seguridad.

Dos capas, las dos obligatorias:

| Capa | Controla | Dónde |
|---|---|---|
| **Grants** | Si un rol puede tocar la tabla/función en absoluto | Al final de cada migración que crea algo |
| **RLS** | Qué filas ve o escribe ese rol | Policies en la misma migración |

## Grants explícitos (cambio de Supabase de 2026)

Supabase dejó de exponer automáticamente las tablas nuevas de `public` a la Data API.
**Sin `grant`, PostgREST responde `42501 permission denied`** aunque las policies estén
bien. Y al revés: este proyecto se creó con los grants por defecto viejos, que le daban a
`anon` `insert/update/delete` sobre toda tabla nueva. Por eso existe la migración
`revocar_escritura_anon_…`, que los revoca y cambia los default privileges.

Regla para tablas nuevas: `grant select … to anon, authenticated` y
`grant insert, update, delete … to authenticated`. Nunca escritura a `anon`.

Funciones: Postgres le da `execute` a `PUBLIC` por defecto. Cada función se crea con
`revoke execute … from public` y `grant execute` explícito al rol que corresponde.

## Staff

**Estar logueado no da ningún permiso**: cualquier cuenta de Auth es `authenticated`. Lo
que da permisos es una fila **activa** en `public.staff` (`user_id`, `email`, `nombre`,
`activo`). **No hay roles: todo el staff activo es admin del panel.** Reemplazó a la
vieja tabla `admins` (migración `staff_y_stock`).

| Función | Devuelve | Para |
|---|---|---|
| `private.es_admin()` | fila activa en `staff` | Las ~70 policies del panel |
| `public.asignar_staff(email, nombre, activo)` | el `user_id` | Alta y cambios desde el panel (Usuarios) |

- **Las `private.*` son `security definer`**: si corrieran como el usuario, chocarían con el
  RLS de `staff`. Viven en `private`, que la Data API no expone: una definer en `public`
  es un endpoint RPC que cualquiera puede llamar.
- `asignar_staff` es **invoker**: chequea `es_admin` y escribe a través del RLS. Para
  encontrar al usuario por email usa `private.usuario_por_email` (definer, lee
  `auth.users`), que la API no expone. **La persona tiene que tener cuenta**: si no,
  `No hay ningún usuario con el email …`.
- **Trigger `staff_ultimo_admin`**: rechaza quitar, apagar o bajar de rol al último admin
  activo (`Tiene que quedar al menos un admin activo`). Sin él, nadie volvería a entrar al
  panel.
- `execute` sólo para `authenticated`. `anon` no las puede llamar, por eso **las policies
  van separadas por rol** (`to anon` nunca menciona `es_admin`): una policy de `anon`
  que la llame da *permission denied for function*.
- La web pregunta con `rpc('es_admin')`: `public.es_admin()` es un wrapper
  `security invoker` sólo ejecutable por `authenticated`.
- **En las policies, `(select private.es_admin())`** y no la llamada directa: con el
  `select` se evalúa una vez por consulta (initPlan), no una vez por fila.

## Policies por tabla

| Tabla | `anon` select | `authenticated` select | escritura |
|---|---|---|---|
| `productos` | `publicado` | `publicado or es_admin` | admin |
| `producto_imagenes`, `producto_etiquetas` | producto publicado | ídem o admin | admin |
| `producto_variantes` | `activa` y producto publicado | ídem o admin | admin |
| `variante_etiquetas` | la variante es visible (RLS anidado) | ídem o admin | admin |
| `categorias`, `grupos_etiqueta`, `etiquetas` | todo | todo | admin |
| `banners` | `activo` | `activo or es_admin` | admin |
| `pedidos`, `pedido_items` | — (sin grants) | admin | sólo `crear_pedido` (definer) crea; admin actualiza y borra |
| `staff` | — | la propia fila, o todas si es admin | admin (+ trigger del último admin) |
| `movimientos_stock` | — | admin | nadie por la API: sólo el trigger (ver [variantes-y-stock](variantes-y-stock.md#historial-de-stock)) |
| `storage.objects` bucket `catalogo` | URL pública, sin policy | admin (listar/borrar) | admin |

- **Las tablas hijas miran al padre.** Si `producto_imagenes` tuviera select libre, un
  borrador filtraría sus fotos y su existencia.
- **Escritura: una policy por acción (insert/update/delete), nunca `for all`.** `for all`
  también cubre SELECT y se suma a la de lectura: dos policies permisivas por fila
  (advisor `multiple_permissive_policies`). Ya pasó; lo corrigió la migración
  `separar_policies_escritura`.
- UPDATE necesita `using` y `with check`, y además una policy de SELECT: sin ella el
  update afecta 0 filas sin error.
- **La única función `security definer` en `public` es `crear_pedido`, a propósito**:
  `anon` no tiene grants sobre `pedidos` y la función es la puerta controlada. Por eso
  valida todo adentro y chequea `publicado`/`activa` a mano (ver [carrito](carrito.md)).
  Cualquier otra definer va en `private`.
- **Los RPC del catálogo son `security invoker`**: respetan el RLS de quien llama. Un
  `security definer` en `buscar_productos` expondría borradores.

## Verificación

Después de cada migración: `supabase db advisors --db-url …` tiene que dar
*No issues found*. Y probar como `anon` por HTTP (con la publishable key):

```
POST /rest/v1/productos              → 42501 permission denied
GET  /rest/v1/staff                  → []
POST /rest/v1/rpc/guardar_variantes  → 42501 permission denied
GET  /rest/v1/productos?slug=eq.<borrador> → []
```

## Auditoría

`cd web && node scripts/auditar-permisos.mjs` entra como un usuario **logueado sin fila
en `staff`** y como **visitante**, e intenta lo que no deberían poder: escribir productos,
stock, categorías, cupones, promociones y banners; confirmar pedidos; subir al bucket;
leer cupones, pedidos, historial y staff; agregarse al staff. Cada intento tiene que
fallar; si alguno pasa, termina con código 1. Usa sólo la publishable key y las
credenciales `PRUEBA_*` de `web/.env` (las crea `crear-admin.mjs … --sin-permisos`). Sin
productos publicados saltea los intentos sobre productos y variantes: corrida en una base
vacía, prueba menos.

**Correrla después de toda migración que toque grants o policies, y antes de habilitar
los sign-ups.**

## Auth

- Email y contraseña. **Sign-ups deshabilitados** en el dashboard de Supabase
  (Authentication → Sign In / Providers): con signups abiertos cualquiera crea un
  usuario `authenticated`; no es admin, pero aumenta superficie.
- En el servidor, identidad con `getClaims()`, nunca `getSession()` (ver
  [clientes-supabase](../web/clientes-supabase.md#identidad-en-el-servidor)).

### Alta de personal

- **Desde el panel** (Usuarios): email de una cuenta que ya existe y nombre
  (`asignar_staff`). Con los sign-ups cerrados, las cuentas se crean con el script.
- **Con script** (el primer admin, el usuario de prueba): `cd web && node
  scripts/crear-admin.mjs email@dominio.com [--sin-permisos]` (ver
  [dashboard](../web/dashboard.md#crear-un-admin)).

## Ver también

- [Esquema](esquema.md)
- [Migraciones](migraciones.md)
- [Imágenes](imagenes.md)
- [Clientes de Supabase](../web/clientes-supabase.md)
- [Arquitectura](../general/arquitectura.md)
