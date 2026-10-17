#!/usr/bin/env node
// Crea (o reutiliza) un usuario de Supabase Auth y le da un rol de staff.
//
//   cd web && node scripts/crear-admin.mjs tu@email.com                    # admin
//   cd web && node scripts/crear-admin.mjs caja@email.com --rol vendedor   # usuario de prueba
//
// Con el panel andando, el alta de personal se hace desde Usuarios (asignar_staff): este
// script es para el primer admin y para usuarios de prueba.
//
// Herramienta LOCAL: usa SUPABASE_SECRET_KEY de web/.env. La contraseña se genera al
// azar y se guarda en web/.env como <ROL>_EMAIL / <ROL>_PASSWORD. NUNCA se imprime:
// la salida de la terminal puede quedar en logs o transcripciones.

import { randomBytes } from 'node:crypto';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

process.loadEnvFile('.env');
const email = process.argv[2]?.trim().toLowerCase();
const iRol = process.argv.indexOf('--rol');
const rol = iRol > 0 ? process.argv[iRol + 1] : 'admin';
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !['admin', 'encargado', 'vendedor'].includes(rol)) {
  console.error('Uso: node scripts/crear-admin.mjs email@dominio.com [--rol admin|encargado|vendedor]');
  process.exit(1);
}
const PREFIJO = rol.toUpperCase();

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
const { error: e } = await supabase
  .from('staff')
  .upsert({ user_id: usuario.id, email, nombre: email.split('@')[0], rol, activo: true }, { onConflict: 'user_id' });
if (e) throw e;
console.log(`✓ staff con rol ${rol}`);

if (passwordNueva) {
  let env = readFileSync('.env', 'utf8');
  env = env.replace(new RegExp(`^${PREFIJO}_(EMAIL|PASSWORD)=.*\\n?`, 'gm'), '');
  writeFileSync('.env', env.endsWith('\n') ? env : `${env}\n`);
  appendFileSync('.env', `${PREFIJO}_EMAIL=${email}\n${PREFIJO}_PASSWORD=${passwordNueva}\n`);
  console.log(`✓ credenciales guardadas en web/.env (${PREFIJO}_EMAIL / ${PREFIJO}_PASSWORD)`);
}
