"""Correr llamadas a la base fuera del hilo de la interfaz.

supabase-py es sincrónico: llamarlo desde un botón congela la ventana hasta que vuelve la
respuesta (y con internet lento, el sistema la marca "No responde"). Cada llamada va a un
hilo del pool y el resultado vuelve por señal al hilo de Qt, que es el único que puede
tocar la interfaz.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from PySide6.QtCore import QObject, QRunnable, QThreadPool, Signal

from pos.servicios.base import ErrorBase


class _Senales(QObject):
    listo = Signal(object)
    fallo = Signal(str)


class _Tarea(QRunnable):
    def __init__(self, funcion: Callable[[], Any]) -> None:
        super().__init__()
        self.funcion = funcion
        self.senales = _Senales()

    def run(self) -> None:
        try:
            resultado = self.funcion()
        except ErrorBase as e:
            self.senales.fallo.emit(str(e))
        except Exception:
            # Cualquier otra cosa: red caída, timeout o una respuesta inesperada.
            self.senales.fallo.emit("No hay conexión con el servidor. Revisá internet y probá de nuevo.")
        else:
            self.senales.listo.emit(resultado)


_vivas: set[_Tarea] = set()


def en_segundo_plano(
    funcion: Callable[[], Any],
    al_terminar: Callable[[Any], None],
    al_fallar: Callable[[str], None],
) -> None:
    tarea = _Tarea(funcion)
    tarea.setAutoDelete(False)
    # Referencia viva hasta que termine: si no, Python puede liberar las señales antes.
    _vivas.add(tarea)

    def listo(resultado: Any) -> None:
        _vivas.discard(tarea)
        al_terminar(resultado)

    def fallo(mensaje: str) -> None:
        _vivas.discard(tarea)
        al_fallar(mensaje)

    tarea.senales.listo.connect(listo)
    tarea.senales.fallo.connect(fallo)
    QThreadPool.globalInstance().start(tarea)
