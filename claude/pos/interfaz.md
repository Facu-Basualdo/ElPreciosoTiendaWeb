# Interfaz

[← Índice pos](INDICE.md)

**supabase-py es sincrónico: una llamada desde un botón congela la ventana** hasta que
vuelve la respuesta, y con internet lento Windows la marca "No responde". Toda llamada a
la base va por `en_segundo_plano(funcion, al_terminar, al_fallar)`
(`servicios/tareas.py`): corre en el `QThreadPool` y el resultado vuelve por señal al hilo
de Qt, **el único que puede tocar widgets**.

## Reglas

- `en_segundo_plano` guarda una referencia a la tarea hasta que termina: sin eso, Python
  puede liberar las señales antes de que lleguen y el callback nunca se ejecuta.
- Errores: `ErrorBase` muestra su mensaje; cualquier otra excepción se traduce a "No hay
  conexión con el servidor. Revisá internet y probá de nuevo." Nunca mostrar un traceback
  al cajero.
- **Los modelos de tabla (`QAbstractTableModel`) usan los nombres de Qt** en métodos y
  parámetros (`rowCount`, `data(index, role)`, `headerData(section, orientation, role)`):
  con otros nombres no sobrescriben y pyright lo marca.
- Búsqueda mientras se escribe con un `QTimer` de 300 ms (no una consulta por tecla).
  Enter busca al instante: así se comporta también el lector de códigos de barras, que
  "tipea" el código y manda Enter.
- Estética como la tienda: blanco y negro, botón principal negro y redondeado, rojo sólo
  para errores (`ui/estilo.py`, estilo Fusion + hoja de estilos).
- Precios con `formato.precio()`, el mismo formato que `formatearPrecio` de la web.

## Probar sin abrir ventanas

Con `QT_QPA_PLATFORM=offscreen` se pueden crear ventanas, simular el login y guardar
capturas con `widget.grab().save(...)`. En Windows hace falta además
`QT_QPA_FONTDIR=C:/Windows/Fonts`: sin eso el modo `offscreen` no encuentra fuentes y todo
el texto sale como cuadrados.

## Ver también

- [Conexión con la base](conexion.md)
- [Empaquetado](empaquetado.md)
- [Tema y marca (web)](../web/tema-y-marca.md)
