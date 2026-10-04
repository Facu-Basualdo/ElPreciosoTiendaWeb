"""Estética del POS: blanco y negro como la tienda, el verde sólo para lo que suma."""

from PySide6.QtGui import QColor, QPalette
from PySide6.QtWidgets import QApplication

HOJA = """
QWidget { font-size: 14px; }
QLineEdit { padding: 8px 10px; border: 1px solid #d4d4d4; border-radius: 8px; background: #ffffff; }
QLineEdit:focus { border-color: #0a0a0a; }
QPushButton { padding: 9px 18px; border-radius: 18px; border: 1px solid #0a0a0a; background: #ffffff; }
QPushButton#primario { background: #0a0a0a; color: #ffffff; font-weight: 600; }
QPushButton:disabled { color: #a3a3a3; border-color: #d4d4d4; background: #f5f5f5; }
QLabel#titulo { font-size: 22px; font-weight: 600; }
QLabel#error { color: #dc2626; }
QLabel#tenue { color: #737373; }
QTableView {
    border: 1px solid #e5e5e5; border-radius: 10px; gridline-color: #f0f0f0;
    selection-background-color: #0a0a0a;
}
QHeaderView::section {
    background: #fafafa; border: none; border-bottom: 1px solid #e5e5e5; padding: 8px; font-weight: 600;
}
"""


def aplicar(app: QApplication) -> None:
    app.setStyle("Fusion")
    paleta = QPalette()
    paleta.setColor(QPalette.ColorRole.Window, QColor("#f5f5f5"))
    paleta.setColor(QPalette.ColorRole.Base, QColor("#ffffff"))
    paleta.setColor(QPalette.ColorRole.Text, QColor("#0a0a0a"))
    paleta.setColor(QPalette.ColorRole.WindowText, QColor("#0a0a0a"))
    paleta.setColor(QPalette.ColorRole.Highlight, QColor("#0a0a0a"))
    paleta.setColor(QPalette.ColorRole.HighlightedText, QColor("#ffffff"))
    app.setPalette(paleta)
    app.setStyleSheet(HOJA)
