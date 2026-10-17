#!/usr/bin/env node
// Auditoría de permisos contra la base real: entra como un usuario logueado que NO es
// admin (el vendedor de prueba) y como visitante, e intenta lo que no deberían poder.
// Cada intento tiene que fallar. Correrla antes de habilitar registros de clientes y
// después de cualquier migración que toque grants o policies.
//
//   cd web && node scripts/crear-admin.mjs vendedor@ejemplo.com --rol vendedor   (una vez)
//   cd web && node scripts/auditar-permisos.mjs
//
// No usa la secret key. Si algo "pasa", lo informa como FALLA y no lo deja escrito:
// los intentos de escritura apuntan a filas que no cambian de valor o se revierten.
// Ver claude/supabase/seguridad-rls.md#auditoría

import { createClient } from '@supabase/supabase-js';

process.loadEnvFile('.env');
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!process.env.VENDEDOR_EMAIL) {
  console.error('Falta el usuario de prueba: node scripts/crear-admin.mjs vendedor@ejemplo.com --rol vendedor');
  process.exit(1);
}

const nuevo = () => createClient(URL, KEY, { auth: { persistSession: false } });
const anon = nuevo();
const vendedor = nuevo();
const { error: eLogin } = await vendedor.auth.signInWithPassword({
  email: process.env.VENDEDOR_EMAIL,
  password: process.env.VENDEDOR_PASSWORD,
});
if (eLogin) throw eLogin;
const { data: yo } = await vendedor.auth.getUser();

let fallas = 0;
const ok = (msg) => console.log(`  ok    ${msg}`);
const falla = (msg) => {
  fallas++;
  console.log(`  FALLA ${msg}`);
};

/** Un intento de escritura tiene que dar error o afectar 0 filas. */
async function debeFallar(nombre, intento) {
  const { data, error } = await intento();
  const filas = Array.isArray(data) ? data.length : data ? 1 : 0;
  if (error || filas === 0) ok(`${nombre} → bloqueado${error ? ` (${error.code ?? error.message})` : ' (0 filas)'}`);
  else falla(`${nombre} → PERMITIDO (${filas} filas)`);
}

/** Una lectura tiene que volver vacía o con error. */
async function noDebeVer(nombre, consulta) {
  const { data, error } = await consulta;
  if (error || !data?.length) ok(`${nombre} → no ve nada`);
  else falla(`${nombre} → ve ${data.length} filas`);
}

// Una fila real de cada tabla, leída como visitante, para intentar modificarla.
const { data: producto } = await anon.from('productos').select('id, nombre').limit(1).single();
const { data: variante } = await anon.from('producto_variantes').select('id, stock').limit(1).single();
const { data: categoria } = await anon.from('categorias').select('id, nombre').limit(1).single();

for (const [quien, c] of [['vendedor (logueado, no admin)', vendedor], ['visitante', anon]]) {
  console.log(`\n${quien}`);
  await debeFallar('renombrar un producto', () => c.from('productos').update({ nombre: producto.nombre }).eq('id', producto.id).select('id'));
  await debeFallar('cambiar stock', () => c.from('producto_variantes').update({ stock: variante.stock }).eq('id', variante.id).select('id'));
  await debeFallar('crear producto', () => c.from('productos').insert({ nombre: 'Auditoría', slug: `auditoria-${Date.now()}` }).select('id'));
  await debeFallar('renombrar categoría', () => c.from('categorias').update({ nombre: categoria.nombre }).eq('id', categoria.id).select('id'));
  await debeFallar('crear cupón', () => c.from('cupones').insert({ codigo: 'AUDITORIA', tipo: 'porcentaje', valor: 99 }).select('id'));
  await debeFallar('crear promoción', () => c.from('promociones').insert({ nombre: 'Auditoría', tipo: 'porcentaje', valor: 90, alcance_todo: true }).select('id'));
  await debeFallar('crear banner', () => c.from('banners').insert({ imagen_path: 'x.webp' }).select('id'));
  await debeFallar('crear caja', () => c.from('cajas').insert({ nombre: 'Auditoría', punto_venta: 9999 }).select('id'));
  await debeFallar('confirmar un pedido', () => c.rpc('cambiar_estado_pedido', { p_pedido_id: crypto.randomUUID(), p_estado: 'confirmado' }));
  await debeFallar('guardar variantes', () =>
    c.rpc('guardar_variantes', { p_producto_id: producto.id, p_variantes: [{ etiquetas: [], stock: 999, activa: true }] }),
  );
  await debeFallar('subir imagen al bucket', () =>
    c.storage.from('catalogo').upload(`auditoria/${Date.now()}.txt`, new Blob(['x']), { contentType: 'text/plain' }),
  );
  await noDebeVer('leer cupones', c.from('cupones').select('codigo'));
  await noDebeVer('leer pedidos', c.from('pedidos').select('id'));
  await noDebeVer('leer historial de stock', c.from('movimientos_stock').select('id').limit(1));
}

console.log('\nvendedor: escalar privilegios');
await debeFallar('darse rol admin (insert)', () =>
  vendedor.from('staff').insert({ user_id: yo.user.id, email: 'x@x.com', nombre: 'x', rol: 'admin' }).select('user_id'),
);
await debeFallar('darse rol admin (update)', () => vendedor.from('staff').update({ rol: 'admin' }).eq('user_id', yo.user.id).select('user_id'));
await debeFallar('asignar_staff', () => vendedor.rpc('asignar_staff', { p_email: process.env.VENDEDOR_EMAIL, p_nombre: 'x', p_rol: 'admin' }));
const { data: esAdmin } = await vendedor.rpc('es_admin');
esAdmin ? falla('es_admin() da true') : ok('es_admin() da false');
const { data: rol } = await vendedor.rpc('mi_rol');
rol === 'vendedor' ? ok("mi_rol() da 'vendedor'") : falla(`mi_rol() da ${rol}`);
const { data: staff } = await vendedor.from('staff').select('email');
staff?.length === 1 ? ok('ve sólo su fila de staff') : falla(`ve ${staff?.length} filas de staff`);
const { data: cajas, error: eCajas } = await vendedor.from('cajas').select('id');
eCajas ? falla('no puede leer las cajas') : ok(`lee las cajas (${cajas.length})`);

console.log('\nvisitante');
await debeFallar('mi_rol() (no logueado)', () => anon.rpc('mi_rol'));
await noDebeVer('leer staff', anon.from('staff').select('email'));
await noDebeVer('leer cajas', anon.from('cajas').select('id'));

await vendedor.auth.signOut();
console.log(fallas ? `\n${fallas} FALLAS de permisos` : '\nOK: ningún intento indebido pasó');
process.exit(fallas ? 1 : 0);
