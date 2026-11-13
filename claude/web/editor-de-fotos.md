# Editor de fotos

[← Índice web](INDICE.md)

Las fotos del catálogo son el prendedor sobre la plantilla de marca (bandera, sol, logo,
moneda). La dueña las arma desde el celular con **"Foto con la plantilla"** en la galería
del producto (`components/admin/editor-foto.tsx`, funciones en `lib/admin/editor-foto.ts`):

1. **Sacar foto** (`FileTrigger` con `defaultCamera="environment"`) o elegir de la galería.
2. **Quitar el fondo en el navegador** con `@imgly/background-removal` (modelo
   `isnet_fp16`). Sin servidor ni costo por uso.
3. Recortar lo transparente y ubicar el objeto centrado en la **zona libre** de la
   plantilla (`ZONA`: x 8–92 %, y 36–86 %, entre bandera/logo y la moneda).
4. Ajustar: arrastrar, pellizcar (tamaño y giro), sliders de tamaño, giro, brillo,
   contraste y saturación, sombra suave, y volver a la foto con fondo.
5. **Exportar WebP 1080×1920** y subir directo a Storage con `subirWebp` (el mismo camino
   que la galería), después `registrar` del producto.

## Lo que no es obvio

- **El modelo pesa ~80 MB y se baja la primera vez**, de la CDN de img.ly
  (`staticimgly.com`); después queda en la caché del navegador. La pantalla avisa que
  conviene Wi-Fi. `@imgly/background-removal` se importa con `import()` dentro de
  `quitarFondo`: ni la tienda ni el resto del panel cargan `onnxruntime-web`.
- **Licencia AGPL** de `@imgly/background-removal`: es compatible porque el repo es
  público. Si el repo pasara a privado, hay que sacarlo o comprar la licencia comercial.
- **Brillo/contraste/saturación se calculan píxel por píxel** (`aplicarAjustes`), no con
  `ctx.filter`: Safari no soporta `filter` en canvas y en el iPhone la foto saldría sin
  ajustes. Por eso el objeto se limita a 1600 px de lado y los sliders usan
  `useDeferredValue`.
- **El slider de tamaño es relativo** a "entra justo en la zona libre" (100 %). Si fuera
  la escala absoluta, su máximo cambiaría mientras se arrastra.
- **Las telas translúcidas (organza) sobre fondo blanco se pierden** en parte: el modelo
  las toma como fondo. Probado con fotos reales: cintas opacas, alfileres y dijes metálicos
  salen bien; la organza celeste, no. Por eso la pantalla sugiere un fondo oscuro, y queda
  el switch para usar la foto con fondo.
- Si quitar el fondo falla (sin conexión, celular sin memoria), se sigue con la foto
  entera: el switch "Quitar el fondo" queda deshabilitado.
- La vista previa es el lienzo real de 1080×1920 escalado por CSS: lo que se ve es lo
  que se guarda. `touch-action: none` en el canvas para que el pellizco no haga zoom a la
  página. Con teclado: flechas mueven, `+`/`−` tamaño, `[`/`]` giro.
- La plantilla que usa es `public/marca/plantilla.webp` (98 KB). `plantilla.png` (2,3 MB)
  es el original: si cambia la plantilla, regenerar el WebP a partir de él.

## Ver también

- [Imágenes](imagenes.md)
- [Dashboard](dashboard.md)
- [Tema y marca](tema-y-marca.md)
