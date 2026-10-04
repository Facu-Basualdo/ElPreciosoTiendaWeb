"""Arma el .exe portable: `uv run python empaquetado/construir.py` desde `pos/`.

1. Escribe `src/pos/_config_empaquetado.py` con la URL de Supabase y la publishable key
   (públicas; nunca la secret key). Las toma de POS_SUPABASE_URL / POS_SUPABASE_KEY o,
   si no están, de las variables públicas de web/.env (ver src/pos/config.py).
2. Corre PyInstaller en modo un solo archivo y sin consola.
3. Borra el archivo de configuración generado: no es código fuente.

El resultado queda en `pos/dist/Caja.exe`. Ver docs/plan-punto-de-venta.md#decisiones-de-arquitectura
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

import PyInstaller.__main__

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ / "src"))

from pos import __version__, config  # noqa: E402 — después de ajustar sys.path

GENERADO = RAIZ / "src" / "pos" / "_config_empaquetado.py"


def main() -> None:
    c = config.cargar()
    GENERADO.write_text(
        "# Generado por empaquetado/construir.py. Valores públicos; no editar ni commitear.\n"
        f"SUPABASE_URL = {c.supabase_url!r}\nSUPABASE_KEY = {c.supabase_key!r}\n",
        encoding="utf-8",
    )
    inicio = time.perf_counter()
    try:
        PyInstaller.__main__.run(
            [
                str(RAIZ / "empaquetado" / "entrada.py"),
                "--name=Caja",
                "--onefile",
                "--windowed",
                "--noconfirm",
                "--clean",
                f"--paths={RAIZ / 'src'}",
                f"--distpath={RAIZ / 'dist'}",
                f"--workpath={RAIZ / 'build'}",
                f"--specpath={RAIZ / 'build'}",
                "--hidden-import=pos._config_empaquetado",
            ]
        )
    finally:
        GENERADO.unlink(missing_ok=True)
    exe = RAIZ / "dist" / "Caja.exe"
    print(f"Caja {__version__}: {exe} ({exe.stat().st_size / 1e6:.1f} MB) en {time.perf_counter() - inicio:.0f} s")


if __name__ == "__main__":
    main()
