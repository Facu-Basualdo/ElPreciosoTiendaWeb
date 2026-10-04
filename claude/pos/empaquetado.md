# Empaquetado

[← Índice pos](INDICE.md)

**Se arma con `uv run python empaquetado/construir.py` desde `pos/`**, nunca llamando a
PyInstaller a mano: el script escribe primero `src/pos/_config_empaquetado.py` con la
configuración pública (ver [conexion](conexion.md)), corre PyInstaller y borra ese archivo
al final, aunque el build falle. Sin ese paso, el `.exe` arranca sin saber a qué base
conectarse.

## Qué sale

`pos/dist/Caja.exe`: un solo archivo, sin consola (`--onefile --windowed`), que se copia
y se ejecuta en cualquier carpeta. Medido en la fase 0 (Windows 11, Python 3.12, PySide6
6.11):

| Medida | Valor |
|---|---|
| Tamaño | 58,5 MB |
| Arranque hasta la ventana de login | 5,1 s la primera vez, 2,6 s las siguientes |
| Windows Defender (`MpCmdRun -Scan`) | Sin detecciones |
| Tiempo de build | ~1 minuto |

El arranque lento es propio de `--onefile`: descomprime todo a una carpeta temporal en
cada apertura. Si molesta, la alternativa es `--onedir` (una carpeta en vez de un
archivo) o Nuitka.

## Diagnóstico

`Caja.exe --diagnostico` prueba configuración y conexión sin abrir ventanas. Como el
`.exe` no tiene consola, escribe el resultado en `%TEMP%\caja-diagnostico.txt` y sale con
código 0 (conecta) o 2 (no). **Es la forma de verificar un build**: lo que más se rompe al
empaquetar son los certificados SSL y la configuración inyectada, y las dos fallan acá
antes que en la caja.

## Gotchas

- **Python de la Microsoft Store**: PyInstaller tiene problemas con él. El proyecto fija
  Python 3.12 en `.python-version` y lo instala `uv` (`uv python install` lo hace solo al
  correr `uv sync`).
- La versión que ve el usuario sale de `pos/__init__.py` (`__version__`). Cuando exista el
  control de versión mínima (fase 9), cada release tiene que subirla.
- `build/` y `dist/` no se commitean; el `.exe` se distribuye aparte.

## Ver también

- [Conexión con la base](conexion.md)
- [Interfaz](interfaz.md)
- [Entorno y deploy](../general/entorno-y-deploy.md)
