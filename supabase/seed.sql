-- Taxonomía inicial de El Precioso: categorías, grupos de etiquetas y qué grupos pide
-- cada categoría en el panel. Sin productos: los carga la dueña desde el panel.
-- Idempotente: no hace nada si ya hay categorías. Ver claude/supabase/migraciones.md#seed
do $seed$
begin
  if exists (select 1 from public.categorias) then
    raise notice 'Ya hay categorías: seed omitido';
    return;
  end if;

  insert into public.categorias (slug, nombre, orden) values
    ('escarapelas', 'Escarapelas', 1),
    ('prendedores', 'Prendedores', 2),
    ('personalizados', 'Personalizados', 3),
    ('packs', 'Packs', 4);

  -- La base (cómo se prende) es la variante: cada una tiene su propio precio.
  insert into public.grupos_etiqueta (slug, nombre, orden, es_variante, visible_en_ficha, icono, con_color) values
    ('base', 'Base', 1, true, true, 'Paperclip', false),
    ('fecha', 'Fecha patria', 2, false, true, 'Calendar', false),
    ('dije', 'Dije', 3, false, true, 'Star', false),
    ('color', 'Colores', 4, false, true, 'Palette', true);

  insert into public.etiquetas (grupo_id, valor, orden, color_hex)
  select g.id, e.valor, e.orden, e.color_hex
  from (values
    ('base', 'Alfiler gancho común', 0, null),
    ('base', 'Base gancho', 1, null),
    ('base', 'Alfiler de gancho grande', 2, null),
    ('base', 'Alfiler grande con cuelga dije', 3, null),
    ('base', 'Pin solapero pasante', 4, null),
    ('fecha', '25 de Mayo', 0, null),
    ('fecha', '20 de Junio', 1, null),
    ('fecha', '9 de Julio', 2, null),
    ('fecha', '2 de Abril', 3, null),
    ('fecha', 'Mundial', 4, null),
    ('dije', 'Estrella', 0, null),
    ('dije', 'Sol', 1, null),
    ('dije', 'Malvinas', 2, null),
    ('dije', 'Guitarra', 3, null),
    ('dije', 'Pava', 4, null),
    ('dije', 'Cabildo', 5, null),
    ('dije', 'Corazón', 6, null),
    ('dije', 'Paloma', 7, null),
    ('dije', 'Pelota', 8, null),
    ('color', 'Celeste', 0, '#74acdf'),
    ('color', 'Blanco', 1, '#ffffff'),
    ('color', 'Dorado', 2, '#fcbf49')
  ) as e (grupo, valor, orden, color_hex)
  join public.grupos_etiqueta g on g.slug = e.grupo;

  -- Todas las categorías piden los cuatro grupos.
  insert into public.categoria_grupos (categoria_id, grupo_id)
  select c.id, g.id from public.categorias c cross join public.grupos_etiqueta g;
end;
$seed$;
