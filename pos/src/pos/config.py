"""De dónde salen la URL de Supabase y la publishable key.

Las dos son PÚBLICAS (la misma key viaja al navegador en la tienda): la seguridad la ponen
los roles y RLS de la base. La secret key nunca entra en el POS: el .exe se copia a
cualquier máquina y todo lo que lleve adentro es público.

Orden:
1. `_config_empaquetado.py`, que escribe `empaquetado/construir.py` al armar el .exe.
2. Variables de entorno `POS_SUPABASE_URL` y `POS_SUPABASE_KEY`.
3. En desarrollo, las dos variables públicas de `web/.env` (sólo esas dos).
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Config:
    supabase_url: str
    supabase_key: str


class ConfigFaltante(RuntimeError):
    pass


WEB_ENV = Path(__file__).resolve().parents[3] / "web" / ".env"


def _desde_web_env(env: Path = WEB_ENV) -> Config | None:
    if not env.is_file():
        return None
    valores: dict[str, str] = {}
    for linea in env.read_text(encoding="utf-8").splitlines():
        if "=" not in linea or linea.lstrip().startswith("#"):
            continue
        clave, valor = linea.split("=", 1)
        clave = clave.strip()
        # Sólo las públicas: el resto del archivo (contraseña de la base) no se lee.
        if clave in ("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"):
            valores[clave] = valor.strip().strip('"').strip("'")
    url = valores.get("NEXT_PUBLIC_SUPABASE_URL")
    key = valores.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
    return Config(url, key) if url and key else None


def cargar() -> Config:
    try:
        from pos import _config_empaquetado as emp  # type: ignore[attr-defined]

        return Config(emp.SUPABASE_URL, emp.SUPABASE_KEY)
    except ImportError:
        pass
    url, key = os.environ.get("POS_SUPABASE_URL"), os.environ.get("POS_SUPABASE_KEY")
    if url and key:
        return Config(url, key)
    desde_web = _desde_web_env()
    if desde_web:
        return desde_web
    raise ConfigFaltante("Falta la configuración de Supabase (POS_SUPABASE_URL y POS_SUPABASE_KEY).")
