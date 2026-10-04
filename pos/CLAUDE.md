# pos/

Punto de venta de escritorio: Python 3.12 + PySide6 (Qt), empaquetado como un único
`Caja.exe` portable con PyInstaller. Usa la misma base de Supabase que la tienda web.
Plan completo en [docs/plan-punto-de-venta.md](../docs/plan-punto-de-venta.md).

- Índice del área: [claude/pos/INDICE.md](../claude/pos/INDICE.md)
- Hub del proyecto: [CLAUDE.md](../CLAUDE.md)

**Reglas que se cargan siempre:** el POS escribe en la base sólo con funciones RPC (las
reglas de stock y precios viven en la base, no en Python) y nunca lleva la secret key:
ver [conexion](../claude/pos/conexion.md). Las llamadas a la base van fuera del hilo de
Qt: ver [interfaz](../claude/pos/interfaz.md).

Comandos (desde `pos/`): `uv run pos` · `uv run pytest` · `uv run ruff check` ·
`uv run pyright` · `uv run python empaquetado/construir.py`.

No agregues documentación a este archivo: cada tema va como una nota.
