#!/usr/bin/env node
// Crea (o reutiliza) un usuario de Supabase Auth y lo agrega al staff (admin del panel).
//
//   cd web && node scripts/crear-admin.mjs tu@email.com                       # admin
//   cd web && node scripts/crear-admin.mjs prueba@email.com --sin-permisos    # usuario de prueba
//
// Con el panel andando, el alta de personal se hace desde Usuarios (asignar_staff): este
// script es para el primer admin y para el usuario de prueba de auditar-permisos.mjs
// (logueado pero sin fila en staff).
//
// Herramienta LOCAL: usa SUPABASE_SECRET_KEY de web/.env. La contraseña se genera al
// azar y se guarda en web/.env como ADMIN_* o PRUEBA_* (EMAIL / PASSWORD). NUNCA se imprime:
// la salida de la terminal puede quedar en logs o transcripciones.

import { randomBytes } from 'node:crypto';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

process.loadEnvFile('.env');
const email = process.argv[2]?.trim().toLowerCase();
const sinPermisos = process.argv.includes('--sin-permisos');
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error('Uso: node scripts/crear-admin.mjs email@dominio.com [--sin-permisos]');
  process.exit(1);
}
if (!process.env.SUPABASE_SECRET_KEY) {
  console.error('Falta SUPABASE_SECRET_KEY en web/.env (Supabase → Project Settings → API Keys). Es sólo local.');
  process.exit(1);
}
const PREFIJO = sinPermisos ? 'PRUEBA' : 'ADMIN';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

// ¿Ya existe?
let usuario = null;
for (let pagina = 1; !usuario; pagina++) {
  const { data, error } = await supabase.auth.admin.listUsers({ page: pagina, perPage: 200 });
  if (error) throw error;
  usuario = data.users.find((u) => u.email === email) ?? null;
  if (data.users.length < 200) break;
}

let passwordNueva = null;
if (!usuario) {
  passwordNueva = randomBytes(18).toString('base64url');
  const { data, error } = await supabase.auth.admin.createUser({ email, password: passwordNueva, email_confirm: true });
  if (error) throw error;
  usuario = data.user;
  console.log(`✓ usuario creado: ${email}`);
} else {
  console.log(`= el usuario ${email} ya existía (no se cambió su contraseña)`);
}

// La secret key saltea RLS: el alta normal de personal es asignar_staff desde el panel.
if (sinPermisos) {
  const { error: e } = await supabase.from('staff').delete().eq('user_id', usuario.id);
  if (e) throw e;
  console.log('✓ sin fila en staff (logueado, no admin)');
} else {
  const { error: e } = await supabase
    .from('staff')
    .upsert({ user_id: usuario.id, email, nombre: email.split('@')[0], activo: true }, { onConflict: 'user_id' });
  if (e) throw e;
  console.log('✓ agregado al staff (admin del panel)');
}

if (passwordNueva) {
  let env = readFileSync('.env', 'utf8');
  env = env.replace(new RegExp(`^${PREFIJO}_(EMAIL|PASSWORD)=.*\\n?`, 'gm'), '');
  writeFileSync('.env', env.endsWith('\n') ? env : `${env}\n`);
  appendFileSync('.env', `${PREFIJO}_EMAIL=${email}\n${PREFIJO}_PASSWORD=${passwordNueva}\n`);
  console.log(`✓ credenciales guardadas en web/.env (${PREFIJO}_EMAIL / ${PREFIJO}_PASSWORD)`);
}
