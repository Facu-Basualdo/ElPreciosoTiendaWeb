"""Punto de venta de escritorio. Plan en docs/plan-punto-de-venta.md."""

__version__ = "0.1.0"


def main() -> None:
    from pos.app import ejecutar

    ejecutar()
