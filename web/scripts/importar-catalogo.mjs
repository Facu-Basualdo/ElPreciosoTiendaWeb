#!/usr/bin/env node
// Importa las fotos de la landing vieja (repo ElPrecioso) como productos BORRADOR.
//
//   cd web && node scripts/importar-catalogo.mjs              # muestra qué haría
//   cd web && node scripts/importar-catalogo.mjs --ejecutar   # lo hace
//   (--origen <carpeta> si el repo de la landing no está al lado de este)
//
// Cada foto N.jpg → producto "Modelo Nº N" (slug modelo-N), oculto, a pedido, precio 0,
// con la foto en WebP 1080×1920 (ya traen la plantilla de marca: no se recortan, sólo
// se llevan al tamaño). Las de `ingresos/` (79–99) quedan con fecha más nueva: son las
// que muestra "Últimos ingresos" cuando se publiquen. Los flyers (foto con texto, no un
// producto) no se importan: se listan para revisar a mano.
//
// Idempotente: si `modelo-N` ya existe, lo saltea. Herramienta LOCAL: usa
// SUPABASE_SECRET_KEY de web/.env (sube sin sesión de admin). Después, "Refrescar
// tienda" en el panel. Ver claude/supabase/imagenes.md#carga-por-fuera-del-panel

import { randomUUID } from 'node:crypto';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

process.loadEnvFile('.env');
const ejecutar = process.argv.includes('--ejecutar');
const iOrigen = process.argv.indexOf('--origen');
const RAIZ = iOrigen > 0 ? process.argv[iOrigen + 1] : '../../ElPrecioso/public';
const CATALOGO = path.join(RAIZ, 'catalogo');
const INGRESOS = path.join(RAIZ, 'ingresos');

// Fotos con texto (promos de fechas patrias), no productos: banners o descarte.
const FLYERS = new Set([45, 46]);
const ANCHO = 1080;
const ALTO = 1920;

if (!process.env.SUPABASE_SECRET_KEY) {
  console.error('Falta SUPABASE_SECRET_KEY en web/.env (sólo local).');
  process.exit(1);
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const numero = (archivo) => Number.parseInt(archivo, 10);
const fotos = readdirSync(CATALOGO)
  .filter((a) => /^\d+\.(jpe?g|png|webp)$/i.test(a))
  .sort((a, b) => numero(a) - numero(b));
const ingresos = new Set(readdirSync(INGRESOS).map(numero));

const { data: existentes, error: eExistentes } = await supabase.from('productos').select('slug').like('slug', 'modelo-%');
if (eExistentes) throw eExistentes;
const yaEstan = new Set(existentes.map((p) => p.slug));

// Fechas: las de ingresos, en los últimos minutos; el resto, un mes antes. Dentro de
// cada grupo, el número más alto es el más nuevo.
const ahora = Date.now();
const fecha = (n) => new Date(ahora - (ingresos.has(n) ? 100 - n : 30 * 24 * 60 + (100 - n)) * 60_000).toISOString();

let creados = 0;
const salteados = [];
for (const archivo of fotos) {
  const n = numero(archivo);
  const slug = `modelo-${n}`;
  if (FLYERS.has(n)) {
    salteados.push(`${archivo} (flyer: revisar a mano)`);
    continue;
  }
  if (yaEstan.has(slug)) {
    salteados.push(`${archivo} (ya existe ${slug})`);
    continue;
  }
  if (!ejecutar) {
    console.log(`+ ${slug}${ingresos.has(n) ? ' · último ingreso' : ''}`);
    creados++;
    continue;
  }

  const webp = await sharp(path.join(CATALOGO, archivo))
    .rotate()
    .resize(ANCHO, ALTO, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82 })
    .toBuffer();

  const nombre = `Modelo Nº ${n}`;
  const { data: producto, error: eProducto } = await supabase
    .from('productos')
    .insert({ nombre, slug, publicado: false, precio: 0, creado_en: fecha(n) })
    .select('id')
    .single();
  if (eProducto) throw eProducto;

  const ruta = `productos/${producto.id}/${randomUUID()}.webp`;
  const { error: eSubida } = await supabase.storage.from('catalogo').upload(ruta, webp, { contentType: 'image/webp' });
  if (eSubida) {
    // Sin foto no sirve el borrador: se borra para que el próximo intento lo cree de nuevo.
    await supabase.from('productos').delete().eq('id', producto.id);
    throw eSubida;
  }
  const { error: eImagen } = await supabase
    .from('producto_imagenes')
    .insert({ producto_id: producto.id, path: ruta, alt: nombre, orden: 0, ancho: ANCHO, alto: ALTO });
  if (eImagen) throw eImagen;

  creados++;
  console.log(`✓ ${slug}`);
}

console.log(`\n${ejecutar ? 'Creados' : 'Se crearían'}: ${creados} borradores.`);
if (salteados.length) console.log(`Salteados (${salteados.length}):\n  ${salteados.join('\n  ')}`);
if (!ejecutar) console.log('\nNada se escribió. Para hacerlo: --ejecutar');
else console.log('\nListo. En el panel: "Refrescar tienda", y cargá nombre, categoría, bases y precio de cada uno antes de publicarlo.');
