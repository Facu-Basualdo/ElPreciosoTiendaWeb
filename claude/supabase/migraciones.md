# Migraciones

[← Índice supabase](INDICE.md)

Todo el esquema, las policies, las funciones y el bucket de Storage viven en
`supabase/migrations/`. **Nada se crea a mano en el dashboard de Supabase**: lo que se
crea a mano no existe en el stack local ni en otro proyecto, y la próxima migración
que lo asuma falla en un lado y no en el otro.

## Conexión

Se trabaja contra el proyecto remoto con `--db-url`, usando `DATABASE_URL` de
`web/.env` **en el puerto 5432 (session pooler)**:

- El pooler en modo transacción (6543) no soporta sentencias preparadas: la CLI falla
  con errores raros.
- La contraseña tiene que ir *percent-encoded* en la URL.
- **No cargues `web/.env` con `source` / `. ./.env` en bash**: una línea con espacios
  alrededor del `=` se ejecuta como comando e imprime la URL completa, contraseña
  incluida, en la terminal. Ya pasó. Leé la variable con Node
  (`process.loadEnvFile`) o copiala a mano.

## Flujo

```
npx supabase migration new agregar_x             # nunca inventes el nombre del archivo
npx supabase db push --db-url "$URL" --dry-run   # qué se va a aplicar
npx supabase db push --db-url "$URL" --yes
npx supabase db advisors --db-url "$URL"         # tiene que dar "No issues found"
```

- **Nunca edites una migración ya aplicada.** La CLI registra por timestamp: la
  edición no se vuelve a aplicar y los entornos divergen en silencio. Se corrige con
  otra migración (así se hicieron `separar_policies_escritura` y
  `revocar_escritura_anon_…`).
- **Agregar un parámetro a una función crea otra sobrecarga**, no la reemplaza:
  `drop function nombre(tipos viejos)` y recién después `create`. Después, `grant`
  otra vez con la firma nueva.
- `db push` es manual y va **antes** del deploy de la web (ver
  [entorno-y-deploy](../general/entorno-y-deploy.md#orden-de-un-deploy-con-cambio-de-esquema)).
- **Contra el proyecto, `db query` que escribe exige `--yes`** (la CLI no pregunta en
  modo agente y no cambia nada sin él); para leer, `--read-only`. En Windows pasá el SQL
  con `-f archivo.sql`: como argumento suelto la shell lo parte en palabras.
- `supabase db query` acepta **una sola sentencia**; para varias, envolvelas en un
  bloque `do $$ … $$` o usá `-f archivo.sql` con un único bloque.

## Tipos

```
npx supabase gen types --lang typescript --db-url "$URL" --schema public > web/lib/supabase/database.types.ts
npx prettier --write web/lib/supabase/database.types.ts
```

**Después de cada migración, regenerá y commiteá junto.** Si no, TypeScript acepta
columnas viejas y el error aparece en runtime. Las **columnas generadas** (por ejemplo
`etiquetas.slug`) salen tipadas como `string | null`: normalizá con `?? ""` al leerlas.

## Seed

`supabase/seed.sql` es un único bloque `do $seed$ … $seed$` idempotente (no hace nada
si ya hay categorías) con **sólo la taxonomía inicial**: las cuatro categorías, los
grupos Base (el único de variante), Fecha patria, Dije y Colores, sus etiquetas y
`categoria_grupos`. No hay productos ni datos de demo: los carga la dueña desde el
panel. Lo corre `supabase db reset` en local; en el proyecto se aplicó una vez con
`db query -f supabase/seed.sql --yes`. Se escribe a mano.

Como es idempotente, editarlo no cambia una base que ya tiene categorías: lo que se
agregue después va por el panel.

## Stack local

`supabase start` necesita Docker Desktop y descarga varias imágenes grandes. No es
necesario para trabajar: el flujo de arriba usa el proyecto remoto.

## Ver también

- [Esquema](esquema.md)
- [Seguridad y RLS](seguridad-rls.md)
- [Entorno y deploy](../general/entorno-y-deploy.md)
