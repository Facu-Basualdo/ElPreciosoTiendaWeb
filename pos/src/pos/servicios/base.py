"""Acceso a la base. El POS lee con RPC y, desde la fase 4, escribe sólo con RPC.

Las reglas (stock, precios, numeración) viven en la base y las comparte la tienda web:
si el POS las reimplementara en Python, los dos canales dejarían de coincidir.
Ver docs/plan-punto-de-venta.md#decisiones-de-arquitectura
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, cast

from supabase import Client, create_client
from supabase_auth.errors import AuthApiError

from pos.config import Config


class ErrorBase(RuntimeError):
    """Error con un mensaje listo para mostrar al usuario."""


ROLES = {"admin": "Administrador", "encargado": "Encargado", "vendedor": "Vendedor"}


@dataclass(frozen=True)
class Usuario:
    id: str
    email: str
    nombre: str
    rol: str  # admin · encargado · vendedor (tabla staff)

    @property
    def rol_visible(self) -> str:
        return ROLES.get(self.rol, self.rol)


@dataclass(frozen=True)
class ProductoListado:
    id: str
    nombre: str
    marca: str | None
    precio_desde: int
    precio_varia: bool
    stock_total: int
    disponible: bool


class Base:
    def __init__(self, config: Config) -> None:
        self._cliente: Client = create_client(config.supabase_url, config.supabase_key)
        self.usuario: Usuario | None = None

    def iniciar_sesion(self, email: str, contrasena: str) -> Usuario:
        try:
            r = self._cliente.auth.sign_in_with_password({"email": email.strip(), "password": contrasena})
        except AuthApiError as e:
            if e.code == "invalid_credentials":
                raise ErrorBase("Email o contraseña incorrectos.") from e
            raise ErrorBase("No se pudo iniciar sesión. Probá de nuevo.") from e
        if not r.user:
            raise ErrorBase("No se pudo iniciar sesión. Probá de nuevo.")
        # Entra el staff activo, con cualquier rol. Un cliente de la tienda también es un
        # usuario de Auth: sin fila activa en `staff` no pasa (RLS: cada uno ve sólo la suya).
        respuesta = (
            self._cliente.table("staff").select("nombre, rol, activo").eq("user_id", r.user.id).maybe_single().execute()
        )
        fila = cast(dict[str, Any], (respuesta.data if respuesta else None) or {})
        if not fila.get("activo") or fila.get("rol") not in ROLES:
            self._cliente.auth.sign_out()
            raise ErrorBase("Tu usuario no tiene permiso para usar la caja. Pedíselo a un administrador.")
        self.usuario = Usuario(r.user.id, r.user.email or email, fila["nombre"], fila["rol"])
        return self.usuario

    def cerrar_sesion(self) -> None:
        self._cliente.auth.sign_out()
        self.usuario = None

    def buscar_productos(self, texto: str = "", limite: int = 48) -> list[ProductoListado]:
        datos = cast(
            list[dict[str, Any]],
            self._cliente.rpc(
                "buscar_productos",
                {"p_q": texto.strip() or None, "p_limite": limite, "p_orden": "relevancia"},
            )
            .execute()
            .data
            or [],
        )
        return [
            ProductoListado(
                id=p["id"],
                nombre=p["nombre"],
                marca=p.get("marca"),
                precio_desde=round(p["precio_desde"] or 0),
                precio_varia=bool(p["precio_varia"]),
                stock_total=int(p["stock_total"] or 0),
                disponible=bool(p["disponible"]),
            )
            for p in datos
        ]
