# Índice — pos

Python 3.12 (instalado por `uv`, no el de la Microsoft Store) · PySide6 (Qt 6) ·
`supabase-py` · PyInstaller. Código en `pos/src/pos/`, build en `pos/empaquetado/`.

[← CLAUDE.md](../../CLAUDE.md)

## Protocolo de trabajo

Antes de tocar el POS leé [conexion](conexion.md) (qué puede hacer contra la base) y
[interfaz](interfaz.md) (hilos y Qt). Si el cambio necesita algo nuevo de la base, la
migración va en `supabase/` como cualquier otra (ver
[migraciones](../supabase/migraciones.md)) y se expone como RPC. El diseño de lo que
falta está en [docs/plan-punto-de-venta.md](../../docs/plan-punto-de-venta.md).

## Notas

| Nota | De qué trata |
|---|---|
| [Conexión con la base](conexion.md) | Sólo la publishable key, nunca la secret (el `.exe` es público) · config: archivo inyectado al empaquetar → `POS_SUPABASE_*` → las dos variables públicas de `web/.env` · escritura sólo por RPC · hasta la fase 1 entran sólo los admins (`es_admin`) · errores ya redactados para el cajero |
| [Interfaz](interfaz.md) | supabase-py es sincrónico: toda llamada va por `en_segundo_plano` o la ventana se congela · sólo el hilo de Qt toca widgets · métodos de modelos con los nombres de Qt (`role`, `section`) o no se sobrescriben · blanco y negro como la tienda · pruebas `offscreen` necesitan `QT_QPA_FONTDIR` |
| [Empaquetado](empaquetado.md) | `construir.py` inyecta la config pública, corre PyInstaller `--onefile --windowed` y borra lo generado · 58,5 MB, abre en 5 s en frío y 2,6 s después, Defender limpio · `Caja.exe --diagnostico` prueba config y SSL sin ventana · Python del Store rompe PyInstaller |
