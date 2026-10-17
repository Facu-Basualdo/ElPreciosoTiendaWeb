# Conexión con la base

[← Índice pos](INDICE.md)

**El `Caja.exe` lleva adentro la URL de Supabase y la publishable key, y nada más.** Las
dos son públicas: la tienda manda la misma key a cada navegador. El `.exe` se copia a
cualquier máquina, así que todo lo que lleve adentro hay que darlo por público: **la
secret key nunca entra**. Si algo "sólo funciona con la secret key", falta un grant, una
policy o una RPC en la base (ver [seguridad-rls](../supabase/seguridad-rls.md)).

## De dónde sale la configuración

`src/pos/config.py`, en este orden:

| Origen | Cuándo |
|---|---|
| `pos/_config_empaquetado.py` | Dentro del `.exe`: lo escribe `empaquetado/construir.py` y lo borra al terminar (ignorado por git) |
| `POS_SUPABASE_URL` + `POS_SUPABASE_KEY` | Para apuntar a otra base sin tocar archivos |
| `web/.env` | Desarrollo: **sólo** `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; el resto del archivo (contraseña de la base) no se lee |

## Reglas

- **El POS lee y escribe por RPC**, no armando consultas sobre tablas: precios, stock y
  numeración los decide la base, la misma lógica que usa la web (`buscar_productos`,
  `cotizar`; desde la fase 4, `registrar_venta`). Si Python recalculara precios, el
  ticket y la tienda dejarían de coincidir.
- Login con la Auth de Supabase (`sign_in_with_password`), el mismo usuario que el panel
  web. Después lee **su propia fila de `staff`** (RLS sólo le deja ver la suya): entra
  cualquier rol activo (vendedor, encargado, admin) y `Usuario` guarda `nombre` y `rol`.
  Sin fila activa (un cliente de la tienda, o alguien apagado en Usuarios) queda
  deslogueado con "Tu usuario no tiene permiso para usar la caja". Qué puede hacer cada rol
  dentro del POS lo vuelve a exigir la base en cada RPC, no la interfaz (ver
  [seguridad-rls](../supabase/seguridad-rls.md#staff-y-roles)).
- `Base` (`servicios/base.py`) lanza `ErrorBase` con un mensaje ya redactado para el
  cajero ("Email o contraseña incorrectos."). Cualquier otra excepción (red, timeout) se
  muestra como "No hay conexión con el servidor": ver [interfaz](interfaz.md).
- Las respuestas de las RPC se tipan a mano (dataclasses): Supabase no genera tipos para
  Python. Cuando una migración cambia una RPC que usa el POS, hay que actualizar su modelo.

## Ver también

- [Interfaz](interfaz.md)
- [Empaquetado](empaquetado.md)
- [Arquitectura](../general/arquitectura.md)
- [Seguridad y RLS](../supabase/seguridad-rls.md)
