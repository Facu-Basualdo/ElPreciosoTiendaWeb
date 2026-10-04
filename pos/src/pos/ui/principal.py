from __future__ import annotations

from PySide6.QtCore import QAbstractTableModel, QModelIndex, QPersistentModelIndex, Qt, QTimer
from PySide6.QtWidgets import (
    QHBoxLayout,
    QHeaderView,
    QLabel,
    QLineEdit,
    QMainWindow,
    QPushButton,
    QTableView,
    QVBoxLayout,
    QWidget,
)

from pos import __version__, formato
from pos.servicios.base import Base, ProductoListado, Usuario
from pos.servicios.tareas import en_segundo_plano

_Indice = QModelIndex | QPersistentModelIndex


class ModeloProductos(QAbstractTableModel):
    COLUMNAS = ("Producto", "Marca", "Precio", "Stock")

    def __init__(self) -> None:
        super().__init__()
        self.filas: list[ProductoListado] = []

    def cargar(self, filas: list[ProductoListado]) -> None:
        self.beginResetModel()
        self.filas = filas
        self.endResetModel()

    # Nombres de métodos y parámetros: los de Qt (rowCount, role…); si no, no se sobrescriben.
    def rowCount(self, parent: _Indice = QModelIndex()) -> int:
        return len(self.filas)

    def columnCount(self, parent: _Indice = QModelIndex()) -> int:
        return len(self.COLUMNAS)

    def headerData(self, section: int, orientation: Qt.Orientation, role: int = Qt.ItemDataRole.DisplayRole) -> object:
        if role == Qt.ItemDataRole.DisplayRole and orientation == Qt.Orientation.Horizontal:
            return self.COLUMNAS[section]
        return None

    def data(self, index: _Indice, role: int = Qt.ItemDataRole.DisplayRole) -> object:
        p = self.filas[index.row()]
        col = index.column()
        if role == Qt.ItemDataRole.DisplayRole:
            if col == 0:
                return p.nombre
            if col == 1:
                return p.marca or "—"
            if col == 2:
                return ("desde " if p.precio_varia else "") + formato.precio(p.precio_desde)
            return str(p.stock_total) if p.disponible else "Sin stock"
        if role == Qt.ItemDataRole.TextAlignmentRole and col >= 2:
            return int(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
        return None


class VentanaPrincipal(QMainWindow):
    """Fase 0: buscador y lista de productos. La venta llega en las fases 3 y 4."""

    def __init__(self, base: Base, usuario: Usuario) -> None:
        super().__init__()
        self.base = base
        self.setWindowTitle(f"Caja — {usuario.email}")
        self.resize(1100, 700)

        self.buscador = QLineEdit(placeholderText="Buscar por nombre…  (o escaneá el código)")
        self.boton_salir = QPushButton("Salir")
        arriba = QHBoxLayout()
        arriba.addWidget(self.buscador, 1)
        arriba.addWidget(self.boton_salir)

        self.modelo = ModeloProductos()
        self.tabla = QTableView()
        self.tabla.setModel(self.modelo)
        self.tabla.verticalHeader().hide()
        self.tabla.setSelectionBehavior(QTableView.SelectionBehavior.SelectRows)
        self.tabla.setAlternatingRowColors(True)
        cabecera = self.tabla.horizontalHeader()
        cabecera.setSectionResizeMode(0, QHeaderView.ResizeMode.Stretch)
        for c in (1, 2, 3):
            cabecera.setSectionResizeMode(c, QHeaderView.ResizeMode.ResizeToContents)

        self.estado = QLabel()
        self.estado.setObjectName("tenue")

        centro = QWidget()
        caja = QVBoxLayout(centro)
        caja.setContentsMargins(20, 20, 20, 20)
        caja.addLayout(arriba)
        caja.addWidget(self.tabla, 1)
        caja.addWidget(self.estado)
        self.setCentralWidget(centro)
        self.statusBar().showMessage(f"Conectado como {usuario.email} · versión {__version__}")

        # Buscar mientras se escribe, sin una consulta por tecla.
        self._espera = QTimer(self, singleShot=True, interval=300)
        self._espera.timeout.connect(self.buscar)
        self.buscador.textChanged.connect(lambda _: self._espera.start())
        self.buscador.returnPressed.connect(self.buscar)

        self.buscar()
        self.buscador.setFocus()

    def buscar(self) -> None:
        texto = self.buscador.text()
        self.estado.setText("Buscando…")
        en_segundo_plano(lambda: self.base.buscar_productos(texto), self._mostrar, self.estado.setText)

    def _mostrar(self, filas: list[ProductoListado]) -> None:
        self.modelo.cargar(filas)
        self.estado.setText(f"{len(filas)} productos" if filas else "No hay productos con esa búsqueda.")
