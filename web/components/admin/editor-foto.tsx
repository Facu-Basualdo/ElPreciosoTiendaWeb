"use client";

import { ArrowRotateLeft, Camera, Picture } from "@gravity-ui/icons";
import { Button, Label, Modal, ProgressBar, Slider, Switch, toast } from "@heroui/react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { FileTrigger } from "react-aria-components";
import {
  aplicarAjustes,
  cargarImagenUrl,
  dibujar,
  exportar,
  LIENZO,
  PLANTILLA,
  quitarFondo,
  recortarTransparencia,
  REFUERZO_INICIAL,
  reforzarRecorte,
  SIN_AJUSTES,
  transformacionInicial,
  type Ajustes,
  type Transformacion,
} from "@/lib/admin/editor-foto";
import { subirWebp } from "@/lib/admin/subir-imagen";
import type { ImagenSubida } from "./subida-imagen";

const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

/**
 * Foto del celular → sin fondo → sobre la plantilla de marca, como las del catálogo.
 * Guarda un WebP 1080×1920 en la galería del producto. Ver claude/web/editor-de-fotos.md
 */
export function EditorFoto({
  carpeta,
  onGuardada,
  destacado = false,
}: {
  carpeta: string;
  onGuardada: (imagen: ImagenSubida) => Promise<void>;
  /** Botón principal (dorado y ancho): cuando el producto todavía no tiene fotos. */
  destacado?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <Button variant={destacado ? "primary" : "secondary"} size={destacado ? "lg" : "md"} fullWidth={destacado} onPress={() => setAbierto(true)}>
        <Picture />
        Foto con la plantilla
      </Button>
      {abierto && <Dialogo carpeta={carpeta} onGuardada={onGuardada} onCerrar={() => setAbierto(false)} />}
    </>
  );
}

type Bases = { sinFondo: HTMLCanvasElement | null; conFondo: HTMLCanvasElement };

function Dialogo({
  carpeta,
  onGuardada,
  onCerrar,
}: {
  carpeta: string;
  onGuardada: (imagen: ImagenSubida) => Promise<void>;
  onCerrar: () => void;
}) {
  const [plantilla, setPlantilla] = useState<HTMLImageElement | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState<number | null>(null);
  const [bases, setBases] = useState<Bases | null>(null);
  const [usarSinFondo, setUsarSinFondo] = useState(true);
  const [ajustes, setAjustes] = useState<Ajustes>(SIN_AJUSTES);
  const [refuerzo, setRefuerzo] = useState(REFUERZO_INICIAL);
  const [t, setT] = useState<Transformacion | null>(null);
  const [sombra, setSombra] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarImagenUrl(PLANTILLA).then(setPlantilla, () => toast.danger("No se pudo cargar la plantilla."));
  }, []);

  const sinFondo = !!(usarSinFondo && bases?.sinFondo);
  const base = bases ? (sinFondo && bases.sinFondo ? bases.sinFondo : bases.conFondo) : null;
  // Refuerzo y ajustes recorren cada píxel: se calculan con el valor diferido para no trabar el slider.
  const ajustesDiferidos = useDeferredValue(ajustes);
  const refuerzoDiferido = useDeferredValue(refuerzo);
  const reforzada = useMemo(() => (base && sinFondo ? reforzarRecorte(base, refuerzoDiferido) : base), [base, sinFondo, refuerzoDiferido]);
  const objeto = useMemo(() => (reforzada ? aplicarAjustes(reforzada, ajustesDiferidos) : null), [reforzada, ajustesDiferidos]);
  // El slider de tamaño es relativo a "entra justo en la zona libre" (100%).
  const escalaBase = useMemo(() => (base ? transformacionInicial(base).escala : 1), [base]);

  async function procesar(archivos: FileList | null) {
    const archivo = archivos?.[0];
    if (!archivo) return;
    setProcesando(true);
    setProgreso(null);
    try {
      const url = URL.createObjectURL(archivo);
      const original = await cargarImagenUrl(url).finally(() => URL.revokeObjectURL(url));
      const conFondo = recortarTransparencia(original);
      let sinFondo: HTMLCanvasElement | null = null;
      try {
        const png = await quitarFondo(archivo, setProgreso);
        const urlPng = URL.createObjectURL(png);
        sinFondo = recortarTransparencia(await cargarImagenUrl(urlPng).finally(() => URL.revokeObjectURL(urlPng)));
      } catch {
        toast.danger("No se pudo quitar el fondo: seguí con la foto entera o probá con otra.");
      }
      setBases({ sinFondo, conFondo });
      setUsarSinFondo(!!sinFondo);
      setAjustes(SIN_AJUSTES);
      setRefuerzo(REFUERZO_INICIAL);
      setT(transformacionInicial(sinFondo ?? conFondo));
    } catch {
      toast.danger("Esa imagen no se pudo abrir. Probá con una foto JPG o PNG.");
    } finally {
      setProcesando(false);
    }
  }

  async function guardar() {
    if (!plantilla || !objeto || !t) return;
    setGuardando(true);
    try {
      const blob = await exportar(plantilla, objeto, t, sombra);
      const path = await subirWebp(carpeta, blob);
      await onGuardada({ path, ancho: LIENZO.ancho, alto: LIENZO.alto });
      toast.success("Foto agregada a la galería");
      onCerrar();
    } catch (e) {
      toast.danger(`No se pudo guardar la foto: ${e instanceof Error ? e.message : "error desconocido"}`);
    } finally {
      setGuardando(false);
    }
  }

  const listo = !!(plantilla && objeto && t);

  return (
    <Modal.Backdrop isOpen isDismissable={false} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <Modal.Container size="full">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Foto con la plantilla</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            {!bases || procesando ? (
              <PasoElegir procesando={procesando} progreso={progreso} onElegir={procesar} />
            ) : (
              <div className="grid gap-6 md:grid-cols-[minmax(0,22rem)_1fr]">
                <div className="mx-auto w-full max-w-[22rem]">
                  {listo ? (
                    <Lienzo plantilla={plantilla} objeto={objeto} t={t} sombra={sombra} onCambiar={setT} />
                  ) : (
                    <div className="aspect-[9/16] w-full animate-pulse rounded-xl bg-surface-secondary" />
                  )}
                  <p className="mt-2 text-center text-xs text-muted">
                    Arrastrá para mover · pellizcá para agrandar y girar
                  </p>
                </div>

                <div className="flex w-full max-w-md flex-col gap-5">
                  <Switch
                    isSelected={usarSinFondo && !!bases.sinFondo}
                    isDisabled={!bases.sinFondo}
                    onChange={(v) => {
                      setUsarSinFondo(v);
                      setT(transformacionInicial(v && bases.sinFondo ? bases.sinFondo : bases.conFondo));
                    }}
                  >
                    <Switch.Content>
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Label>Quitar el fondo</Label>
                    </Switch.Content>
                  </Switch>
                  {sinFondo && (
                    <Control
                      etiqueta="Rellenar transparencias"
                      valor={refuerzo}
                      min={0}
                      max={1}
                      paso={0.01}
                      onCambiar={setRefuerzo}
                    />
                  )}

                  {t && (
                    <>
                      <Control
                        etiqueta="Tamaño"
                        valor={Math.min(3, Math.max(0.2, t.escala / escalaBase))}
                        min={0.2}
                        max={3}
                        paso={0.01}
                        onCambiar={(relativa) => setT({ ...t, escala: relativa * escalaBase })}
                      />
                      <Control
                        etiqueta="Giro"
                        valor={t.angulo}
                        min={-180}
                        max={180}
                        paso={1}
                        formato={(v) => `${Math.round(v)}°`}
                        onCambiar={(angulo) => setT({ ...t, angulo })}
                      />
                    </>
                  )}
                  <Control
                    etiqueta="Brillo"
                    valor={ajustes.brillo}
                    min={0.5}
                    max={1.6}
                    paso={0.01}
                    onCambiar={(brillo) => setAjustes((a) => ({ ...a, brillo }))}
                  />
                  <Control
                    etiqueta="Contraste"
                    valor={ajustes.contraste}
                    min={0.5}
                    max={1.6}
                    paso={0.01}
                    onCambiar={(contraste) => setAjustes((a) => ({ ...a, contraste }))}
                  />
                  <Control
                    etiqueta="Saturación"
                    valor={ajustes.saturacion}
                    min={0}
                    max={2}
                    paso={0.01}
                    onCambiar={(saturacion) => setAjustes((a) => ({ ...a, saturacion }))}
                  />
                  <Switch isSelected={sombra} onChange={setSombra}>
                    <Switch.Content>
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Label>Sombra suave</Label>
                    </Switch.Content>
                  </Switch>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => {
                        setAjustes(SIN_AJUSTES);
                        setRefuerzo(REFUERZO_INICIAL);
                        if (base) setT(transformacionInicial(base));
                      }}
                    >
                      <ArrowRotateLeft />
                      Volver a empezar
                    </Button>
                    <Button variant="ghost" size="sm" onPress={() => setBases(null)}>
                      Usar otra foto
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onPress={onCerrar} isDisabled={guardando}>
              Cancelar
            </Button>
            <Button isPending={guardando} isDisabled={!listo || procesando} onPress={guardar}>
              Guardar en la galería
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function PasoElegir({
  procesando,
  progreso,
  onElegir,
}: {
  procesando: boolean;
  progreso: number | null;
  onElegir: (archivos: FileList | null) => void;
}) {
  if (procesando) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-3 py-16 text-center">
        <p className="font-medium">Quitando el fondo…</p>
        <ProgressBar
          aria-label="Quitando el fondo"
          isIndeterminate={progreso === null || progreso >= 1}
          value={progreso === null ? undefined : Math.round(progreso * 100)}
        >
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
        <p className="text-sm text-muted">
          La primera vez se baja el programa que recorta (unos 80 MB): conviene estar con Wi-Fi. Después es mucho más rápido.
        </p>
      </div>
    );
  }
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
      <p className="text-muted">
        Sacale una foto al prendedor sobre una superficie lisa y con buena luz. El fondo se quita solo y queda sobre la
        plantilla de la marca. Si tiene organza o cintas claras, mejor sobre un fondo oscuro; si igual se ven lavadas, subí
        «Rellenar transparencias».
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <FileTrigger acceptedFileTypes={TIPOS} defaultCamera="environment" onSelect={onElegir}>
          <Button size="lg">
            <Camera />
            Sacar foto
          </Button>
        </FileTrigger>
        <FileTrigger acceptedFileTypes={TIPOS} onSelect={onElegir}>
          <Button size="lg" variant="outline">
            <Picture />
            Elegir de la galería
          </Button>
        </FileTrigger>
      </div>
    </div>
  );
}

function Control({
  etiqueta,
  valor,
  min,
  max,
  paso,
  formato = (v) => `${Math.round(v * 100)}%`,
  onCambiar,
}: {
  etiqueta: string;
  valor: number;
  min: number;
  max: number;
  paso: number;
  formato?: (v: number) => string;
  onCambiar: (v: number) => void;
}) {
  return (
    <Slider minValue={min} maxValue={max} step={paso} value={valor} onChange={(v) => onCambiar(v as number)}>
      <div className="flex justify-between">
        <Label>{etiqueta}</Label>
        <Slider.Output>{formato(valor)}</Slider.Output>
      </div>
      <Slider.Track>
        <Slider.Fill />
        <Slider.Thumb />
      </Slider.Track>
    </Slider>
  );
}

/**
 * Vista previa a escala del lienzo 1080×1920. Un dedo mueve; dos dedos escalan y giran.
 * Con teclado: flechas mueven, + y − cambian el tamaño, [ y ] giran.
 */
function Lienzo({
  plantilla,
  objeto,
  t,
  sombra,
  onCambiar,
}: {
  plantilla: HTMLImageElement;
  objeto: HTMLCanvasElement;
  t: Transformacion;
  sombra: boolean;
  onCambiar: (t: Transformacion) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const punteros = useRef(new Map<number, { x: number; y: number }>());
  const gesto = useRef<{ t: Transformacion; distancia: number; angulo: number } | null>(null);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const id = requestAnimationFrame(() => dibujar(ctx, plantilla, objeto, t, sombra));
    return () => cancelAnimationFrame(id);
  }, [plantilla, objeto, t, sombra]);

  // Puntos de la pantalla → px del lienzo.
  const aLienzo = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * LIENZO.ancho, y: ((e.clientY - r.top) / r.height) * LIENZO.alto };
  };
  const medir = () => {
    const [a, b] = [...punteros.current.values()];
    return { distancia: Math.hypot(b.x - a.x, b.y - a.y), angulo: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI };
  };

  return (
    <canvas
      ref={ref}
      width={LIENZO.ancho}
      height={LIENZO.alto}
      tabIndex={0}
      role="img"
      aria-label="Vista previa de la foto. Flechas para mover, más y menos para el tamaño, corchetes para girar."
      className="aspect-[9/16] w-full touch-none select-none rounded-xl border border-border outline-none focus-visible:ring-2 focus-visible:ring-focus"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        punteros.current.set(e.pointerId, aLienzo(e));
        if (punteros.current.size === 2) gesto.current = { t, ...medir() };
      }}
      onPointerMove={(e) => {
        const antes = punteros.current.get(e.pointerId);
        if (!antes) return;
        const ahora = aLienzo(e);
        punteros.current.set(e.pointerId, ahora);
        if (punteros.current.size === 1) {
          onCambiar({ ...t, cx: t.cx + ahora.x - antes.x, cy: t.cy + ahora.y - antes.y });
        } else if (punteros.current.size === 2 && gesto.current) {
          const { distancia, angulo } = medir();
          const g = gesto.current;
          onCambiar({ ...t, escala: g.t.escala * (distancia / g.distancia), angulo: g.t.angulo + angulo - g.angulo });
        }
      }}
      onPointerUp={(e) => {
        punteros.current.delete(e.pointerId);
        gesto.current = null;
      }}
      onPointerCancel={(e) => {
        punteros.current.delete(e.pointerId);
        gesto.current = null;
      }}
      onKeyDown={(e) => {
        const paso = e.shiftKey ? 60 : 15;
        const cambios: Record<string, Partial<Transformacion>> = {
          ArrowLeft: { cx: t.cx - paso },
          ArrowRight: { cx: t.cx + paso },
          ArrowUp: { cy: t.cy - paso },
          ArrowDown: { cy: t.cy + paso },
          "+": { escala: t.escala * 1.05 },
          "-": { escala: t.escala / 1.05 },
          "[": { angulo: t.angulo - 5 },
          "]": { angulo: t.angulo + 5 },
        };
        const cambio = cambios[e.key];
        if (!cambio) return;
        e.preventDefault();
        onCambiar({ ...t, ...cambio });
      }}
    />
  );
}
