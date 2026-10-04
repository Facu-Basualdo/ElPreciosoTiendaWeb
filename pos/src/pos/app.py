"""Arranque: configuración → login → ventana principal."""

from __future__ import annotations

import sys

from PySide6.QtWidgets import QApplication, QMessageBox

from pos import config
from pos.servicios.base import Base, Usuario
from pos.ui import estilo
from pos.ui.login import VentanaLogin
from pos.ui.principal import VentanaPrincipal


def diagnostico() -> int:
    """`Caja.exe --diagnostico`: prueba configuración y conexión sin abrir ventanas.

    El .exe no tiene consola, así que el resultado va a `%TEMP%/caja-diagnostico.txt` y al
    código de salida (0 = conecta). Sirve para soporte y para verificar un build: lo que
    más se rompe al empaquetar son los certificados SSL y la configuración inyectada.
    """
    import tempfile
    import time
    from pathlib import Path

    from pos import __version__

    lineas = [f"Caja {__version__}"]
    codigo = 0
    try:
        base = Base(config.cargar())
        inicio = time.perf_counter()
        productos = base.buscar_productos(limite=1)
        lineas.append(f"Conexión OK ({time.perf_counter() - inicio:.2f} s, {len(productos)} producto de prueba)")
    except Exception as e:
        lineas.append(f"ERROR: {type(e).__name__}: {e}")
        codigo = 2
    Path(tempfile.gettempdir(), "caja-diagnostico.txt").write_text("\n".join(lineas) + "\n", encoding="utf-8")
    return codigo


def ejecutar() -> None:
    if "--diagnostico" in sys.argv:
        sys.exit(diagnostico())
    app = QApplication(sys.argv)
    app.setApplicationName("Caja")
    estilo.aplicar(app)

    try:
        base = Base(config.cargar())
    except config.ConfigFaltante as e:
        QMessageBox.critical(None, "Caja", str(e))
        sys.exit(1)

    login = VentanaLogin(base)
    ventanas: dict[str, VentanaPrincipal] = {}

    def abrir(usuario: Usuario) -> None:
        principal = VentanaPrincipal(base, usuario)

        def salir() -> None:
            base.cerrar_sesion()
            principal.close()
            login.show()

        principal.boton_salir.clicked.connect(salir)
        ventanas["principal"] = principal
        login.hide()
        principal.show()

    login.ingreso.connect(abrir)
    login.show()
    sys.exit(app.exec())
