# El Precioso — tienda online

Tienda de **El Precioso**: escarapelas y prendedores patrios artesanales, hechos a mano
en Resistencia, Chaco. Catálogo pensado para el celular, carrito que termina en un
**pedido por WhatsApp** y un panel simple para que la dueña cargue productos y fotos
desde el teléfono.

Parte de [CatalogoTienda](https://github.com/Facu-Basualdo/CatalogoTienda), que sirvió de
base. El plan de lo que falta está en [docs/plan-el-precioso.md](docs/plan-el-precioso.md).

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router, Cache Components) · React 19 · TypeScript |
| UI | HeroUI v3 · Tailwind CSS v4 · Embla (carruseles) · TipTap v3 (descripciones) |
| Datos | Supabase: Postgres 17 con RLS, Storage, Auth |
| Deploy | Vercel |

## Qué tiene

- Catálogo con filtros por etiquetas agrupadas (fecha patria, dije, colores), búsqueda
  sin tildes, orden y paginación.
- Ficha con galería y selector de **base** (cómo se prende), cada una con su precio.
- Carrito con cotización en la base y envío del pedido por WhatsApp con número de pedido.
- Promociones, combos y cupones calculados en la base.
- Panel: productos (variantes, imágenes con recorte, descripción con tablas), pedidos
  con estados, promociones, combos, cupones, banners, etiquetas, categorías y usuarios.
- Seguridad en la base: grants explícitos + Row Level Security; sólo el staff escribe.

## Estructura

```
web/          App Next.js (lo que se despliega en Vercel)
supabase/     Migraciones SQL, seed (taxonomía inicial) y configuración de la CLI
claude/       Documentación técnica en notas (pensada para agentes, legible por humanos)
docs/         Plan de trabajo
scripts/      Verificador de la documentación
```

## Correrlo en local

Requisitos: Node 20+ y un proyecto de Supabase.

```bash
cd web
npm install
cp .env.example .env      # completar con los datos del proyecto de Supabase
npm run dev               # http://localhost:3000
```

### Preparar la base

Desde la raíz del repo, con `DATABASE_URL` (Supabase → Connect → Session pooler,
**puerto 5432**, contraseña *percent-encoded*):

```bash
npx supabase db push --db-url "$DATABASE_URL"                         # esquema, RLS, funciones, bucket
npx supabase db query --db-url "$DATABASE_URL" -f supabase/seed.sql   # categorías y grupos de etiquetas
```

Primer admin del panel (usa `SUPABASE_SECRET_KEY`, sólo local; la contraseña queda en
`web/.env` y no se imprime):

```bash
cd web && node scripts/crear-admin.mjs tu@email.com
```

### Tipos de la base

Después de cada migración:

```bash
npx supabase gen types --lang typescript --db-url "$DATABASE_URL" --schema public > web/lib/supabase/database.types.ts
```

## Deploy en Vercel

- Root Directory: `web`.
- Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
  `NEXT_PUBLIC_SITIO_URL`, `NEXT_PUBLIC_WHATSAPP`. **No** subas `DATABASE_URL` ni la
  secret key: la app no las usa.
- Las migraciones no las aplica el build: `supabase db push` antes de desplegar código
  que las necesite.

## Documentación

La documentación técnica vive en [`claude/`](claude/) como un grafo de notas cortas.
Punto de entrada: [`CLAUDE.md`](CLAUDE.md). Para verificar que no haya enlaces rotos
ni notas huérfanas:

```bash
node scripts/verificar-docs.mjs
```
