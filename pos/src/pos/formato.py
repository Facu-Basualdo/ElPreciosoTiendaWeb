"""Formato de pesos, igual que `formatearPrecio` de la web: ARS sin decimales, punto de miles."""


def precio(valor: float) -> str:
    return "$ " + f"{round(valor):,}".replace(",", ".")
