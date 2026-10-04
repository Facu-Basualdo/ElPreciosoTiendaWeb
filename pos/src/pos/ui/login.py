from __future__ import annotations

from PySide6.QtCore import Qt, Signal
from PySide6.QtWidgets import QFrame, QLabel, QLineEdit, QPushButton, QVBoxLayout, QWidget

from pos import __version__
from pos.servicios.base import Base, Usuario
from pos.servicios.tareas import en_segundo_plano


class VentanaLogin(QWidget):
    """Login del vendedor. Enter en cualquier campo ingresa."""

    ingreso = Signal(object)  # Usuario

    def __init__(self, base: Base) -> None:
        super().__init__()
        self.base = base
        self.setWindowTitle("Caja — Ingresar")
        self.setMinimumSize(420, 440)

        tarjeta = QFrame()
        tarjeta.setStyleSheet("QFrame { background: #ffffff; border-radius: 16px; }")
        caja = QVBoxLayout(tarjeta)
        caja.setContentsMargins(32, 32, 32, 32)
        caja.setSpacing(12)

        titulo = QLabel("Caja")
        titulo.setObjectName("titulo")
        subtitulo = QLabel("Ingresá con tu usuario de la tienda.")
        subtitulo.setObjectName("tenue")
        self.email = QLineEdit(placeholderText="Email")
        self.contrasena = QLineEdit(placeholderText="Contraseña", echoMode=QLineEdit.EchoMode.Password)
        self.error = QLabel()
        self.error.setObjectName("error")
        self.error.setWordWrap(True)
        self.error.hide()
        self.boton = QPushButton("Ingresar")
        self.boton.setObjectName("primario")
        version = QLabel(f"Versión {__version__}")
        version.setObjectName("tenue")
        version.setAlignment(Qt.AlignmentFlag.AlignCenter)

        for w in (titulo, subtitulo, self.email, self.contrasena, self.error, self.boton):
            caja.addWidget(w)
        caja.addStretch()
        caja.addWidget(version)

        raiz = QVBoxLayout(self)
        raiz.setContentsMargins(24, 24, 24, 24)
        raiz.addWidget(tarjeta)

        self.boton.clicked.connect(self.ingresar)
        self.email.returnPressed.connect(self.ingresar)
        self.contrasena.returnPressed.connect(self.ingresar)

    def ingresar(self) -> None:
        email, contrasena = self.email.text(), self.contrasena.text()
        if not email.strip() or not contrasena:
            return self._mostrar_error("Completá email y contraseña.")
        self._ocupado(True)
        en_segundo_plano(lambda: self.base.iniciar_sesion(email, contrasena), self._listo, self._fallo)

    def _listo(self, usuario: Usuario) -> None:
        self._ocupado(False)
        self.contrasena.clear()
        self.ingreso.emit(usuario)

    def _fallo(self, mensaje: str) -> None:
        self._ocupado(False)
        self._mostrar_error(mensaje)
        self.contrasena.selectAll()
        self.contrasena.setFocus()

    def _ocupado(self, si: bool) -> None:
        self.boton.setEnabled(not si)
        self.boton.setText("Ingresando…" if si else "Ingresar")
        self.error.hide()

    def _mostrar_error(self, mensaje: str) -> None:
        self.error.setText(mensaje)
        self.error.show()
