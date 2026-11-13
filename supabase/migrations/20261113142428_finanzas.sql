-- Finanzas: ingresos por pedidos entregados, gastos e ingresos cargados a mano, y costo
-- opcional por variante para estimar la ganancia. Todo sólo admin.
-- Reglas en claude/supabase/finanzas.md

-- ===========================================================================
-- 1. Fecha de entrega del pedido (un pedido cuenta como ingreso al entregarse)
-- ===========================================================================
alter table public.pedidos add column entregado_en timestamptz;

create function private.fijar_entregado_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.estado = 'entregado' and old.estado is distinct from 'entregado' then
    new.entregado_en := now();
  elsif new.estado <> 'entregado' then
    new.entregado_en := null;
  end if;
  return new;
end;
$$;

create trigger pedidos_entregado_en
before update of estado on public.pedidos
for each row execute function private.fijar_entregado_en();

create index pedidos_entregado_en_idx on public.pedidos (entregado_en) where estado = 'entregado';

-- ===========================================================================
-- 2. Costo por variante: tabla aparte porque anon lee producto_variantes entera
-- ===========================================================================
create table public.costos_variante (
  variante_id    uuid primary key references public.producto_variantes (id) on delete cascade,
  costo          numeric(12, 2) not null check (costo >= 0),
  actualizado_en timestamptz not null default now()
);

grant select, insert, update, delete on public.costos_variante to authenticated;
alter table public.costos_variante enable row level security;
create policy "admin lee" on public.costos_variante for select to authenticated using ((select private.es_admin()));
create policy "admin inserta" on public.costos_variante for insert to authenticated with check ((select private.es_admin()));
create policy "admin actualiza" on public.costos_variante for update to authenticated
  using ((select private.es_admin())) with check ((select private.es_admin()));
create policy "admin borra" on public.costos_variante for delete to authenticated using ((select private.es_admin()));

-- Snapshot del costo en el pedido, como el precio: si el costo cambia, el pedido no.
alter table public.pedido_items add column costo_unitario numeric(12, 2) check (costo_unitario >= 0);

-- Definer: corre dentro de crear_pedido (que también es definer) y lee una tabla sólo admin.
create function private.fijar_costo_item()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.variante_id is not null and new.costo_unitario is null then
    new.costo_unitario := (select c.costo from public.costos_variante c where c.variante_id = new.variante_id);
  end if;
  return new;
end;
$$;

create trigger pedido_items_costo
before insert on public.pedido_items
for each row execute function private.fijar_costo_item();

-- ===========================================================================
-- 3. Movimientos de dinero cargados a mano (gastos y ventas fuera de la web)
-- ===========================================================================
create table public.movimientos_dinero (
  id        bigint generated always as identity primary key,
  tipo      text not null check (tipo in ('gasto', 'ingreso')),
  fecha     date not null default (now() at time zone 'America/Argentina/Buenos_Aires')::date,
  monto     numeric(12, 2) not null check (monto > 0),
  categoria text not null,
  medio     text not null default 'efectivo' check (medio in ('efectivo', 'transferencia')),
  nota      text check (length(nota) <= 200),
  pedido_id uuid references public.pedidos (id) on delete set null,
  creado_en timestamptz not null default now(),
  check (
    (tipo = 'gasto' and categoria in ('materiales', 'packaging', 'envios', 'publicidad', 'otros'))
    or (tipo = 'ingreso' and categoria in ('venta_en_mano', 'feria', 'otros'))
  )
);
create index movimientos_dinero_fecha_idx on public.movimientos_dinero (fecha desc);
create index movimientos_dinero_pedido_idx on public.movimientos_dinero (pedido_id);

grant select, insert, update, delete on public.movimientos_dinero to authenticated;
alter table public.movimientos_dinero enable row level security;
create policy "admin lee" on public.movimientos_dinero for select to authenticated using ((select private.es_admin()));
create policy "admin inserta" on public.movimientos_dinero for insert to authenticated with check ((select private.es_admin()));
create policy "admin actualiza" on public.movimientos_dinero for update to authenticated
  using ((select private.es_admin())) with check ((select private.es_admin()));
create policy "admin borra" on public.movimientos_dinero for delete to authenticated using ((select private.es_admin()));

-- ===========================================================================
-- 4. guardar_variantes: también guarda el costo de cada variante
-- ===========================================================================
-- Igual que antes; si una fila trae la clave `costo`, se guarda (null la borra). Una fila
-- sin la clave no toca el costo.
create or replace function public.guardar_variantes(p_producto_id uuid, p_variantes jsonb)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_item     jsonb;
  v_orden    int := 0;
  v_ids      uuid[];
  v_clave    text;
  v_claves   text[] := '{}';
  v_id       uuid;
  v_stock    int;
  v_original int;
  v_actual   int;
  v_costo    numeric;
begin
  if jsonb_typeof(p_variantes) <> 'array' or jsonb_array_length(p_variantes) = 0 then
    raise exception 'Un producto necesita al menos una variante';
  end if;

  perform set_config('app.motivo_stock', 'ajuste', true);
  perform set_config('app.detalle_stock', 'Panel: variantes y stock', true);

  -- 1. Calcular las claves que quedan.
  for v_item in select * from jsonb_array_elements(p_variantes) loop
    v_ids := array(select jsonb_array_elements_text(coalesce(v_item -> 'etiquetas', '[]'::jsonb))::uuid);
    select coalesce(string_agg(e.slug, '/' order by g.orden, g.slug), '')
      into v_clave
      from public.etiquetas e
      join public.grupos_etiqueta g on g.id = e.grupo_id
      where e.id = any (v_ids);
    if v_clave = any (v_claves) then
      raise exception 'Combinación repetida: %', v_clave;
    end if;
    v_claves := v_claves || v_clave;
  end loop;

  -- 2. Borrar primero las que no vienen (libera sus SKU; sus costos se van en cascada).
  delete from public.producto_variantes
  where producto_id = p_producto_id and clave <> all (v_claves);

  -- 3. Crear o actualizar cada una, sus etiquetas y su costo.
  for v_item in select * from jsonb_array_elements(p_variantes) loop
    v_ids := array(select jsonb_array_elements_text(coalesce(v_item -> 'etiquetas', '[]'::jsonb))::uuid);
    v_clave := v_claves[v_orden + 1];
    v_stock := coalesce((v_item ->> 'stock')::int, 0);
    v_original := (v_item ->> 'stock_original')::int;

    -- Bloquea la fila: una confirmación de pedido en paralelo espera a que termine.
    select stock into v_actual
    from public.producto_variantes
    where producto_id = p_producto_id and clave = v_clave
    for update;
    if found and v_original is not null then
      if v_stock = v_original then
        v_stock := v_actual;
      elsif v_actual <> v_original then
        raise exception 'El stock de "%" cambió mientras editabas (ahora hay %). Recargá la página y volvé a cargarlo.',
          coalesce(nullif(v_clave, ''), 'variante única'), v_actual;
      end if;
    end if;

    insert into public.producto_variantes (producto_id, clave, sku, precio, stock, activa, orden)
    values (
      p_producto_id,
      v_clave,
      nullif(trim(v_item ->> 'sku'), ''),
      (v_item ->> 'precio')::numeric,
      v_stock,
      coalesce((v_item ->> 'activa')::boolean, true),
      v_orden
    )
    on conflict (producto_id, clave) do update
      set sku = excluded.sku,
          precio = excluded.precio,
          stock = excluded.stock,
          activa = excluded.activa,
          orden = excluded.orden
    returning id into v_id;

    delete from public.variante_etiquetas where variante_id = v_id;
    insert into public.variante_etiquetas (variante_id, etiqueta_id, grupo_id)
    select v_id, e.id, e.grupo_id from public.etiquetas e where e.id = any (v_ids);

    if v_item ? 'costo' then
      v_costo := (v_item ->> 'costo')::numeric;
      if v_costo is null then
        delete from public.costos_variante where variante_id = v_id;
      else
        insert into public.costos_variante (variante_id, costo) values (v_id, v_costo)
        on conflict (variante_id) do update set costo = excluded.costo, actualizado_en = now();
      end if;
    end if;

    v_orden := v_orden + 1;
  end loop;
end;
$$;

-- ===========================================================================
-- 5. Resúmenes para la pantalla de Finanzas (meses en hora de Argentina)
-- ===========================================================================
create function public.finanzas_por_mes(p_desde date, p_hasta date)
returns table (
  mes             date,
  ventas          numeric,
  pedidos         int,
  otros_ingresos  numeric,
  gastos          numeric,
  costo_vendido   numeric,
  items_sin_costo int
)
language plpgsql stable
set search_path = ''
as $$
begin
  if not (select private.es_admin()) then
    raise exception 'Sólo administradores';
  end if;
  return query
  with meses as (
    select generate_series(date_trunc('month', p_desde), date_trunc('month', p_hasta), interval '1 month')::date as mes
  ),
  entregados as (
    select p.id, p.total,
           date_trunc('month', p.entregado_en at time zone 'America/Argentina/Buenos_Aires')::date as mes
    from public.pedidos p
    where p.estado = 'entregado'
      and (p.entregado_en at time zone 'America/Argentina/Buenos_Aires')::date between p_desde and p_hasta
  ),
  costos as (
    select e.mes,
           sum(i.costo_unitario * i.cantidad) as costo,
           count(*) filter (where i.variante_id is not null and i.costo_unitario is null)::int as sin_costo
    from entregados e
    join public.pedido_items i on i.pedido_id = e.id
    group by e.mes
  ),
  manuales as (
    select date_trunc('month', m.fecha)::date as mes,
           sum(m.monto) filter (where m.tipo = 'ingreso') as ingresos,
           sum(m.monto) filter (where m.tipo = 'gasto') as gastos
    from public.movimientos_dinero m
    where m.fecha between p_desde and p_hasta
    group by 1
  )
  select ms.mes,
         coalesce((select sum(e.total) from entregados e where e.mes = ms.mes), 0),
         (select count(*) from entregados e where e.mes = ms.mes)::int,
         coalesce(ma.ingresos, 0),
         coalesce(ma.gastos, 0),
         coalesce(c.costo, 0),
         coalesce(c.sin_costo, 0)
  from meses ms
  left join manuales ma on ma.mes = ms.mes
  left join costos c on c.mes = ms.mes
  order by ms.mes;
end;
$$;

-- Modelos más vendidos entre dos fechas (pedidos entregados). Las hijas de un combo
-- cuentan para su producto.
create function public.finanzas_mas_vendidos(p_desde date, p_hasta date, p_limite int default 10)
returns table (producto_id uuid, nombre text, unidades int, ingresos numeric)
language plpgsql stable
set search_path = ''
as $$
begin
  if not (select private.es_admin()) then
    raise exception 'Sólo administradores';
  end if;
  return query
  select i.producto_id,
         coalesce(max(pr.nombre), max(i.descripcion)),
         sum(i.cantidad)::int,
         sum(i.subtotal)
  from public.pedido_items i
  join public.pedidos p on p.id = i.pedido_id
  left join public.productos pr on pr.id = i.producto_id
  where p.estado = 'entregado'
    and (p.entregado_en at time zone 'America/Argentina/Buenos_Aires')::date between p_desde and p_hasta
    and i.producto_id is not null
  group by i.producto_id
  order by 3 desc, 4 desc
  limit greatest(1, least(p_limite, 50));
end;
$$;

-- ===========================================================================
-- Grants de funciones
-- ===========================================================================
revoke execute on function
  private.fijar_entregado_en(),
  private.fijar_costo_item(),
  public.finanzas_por_mes(date, date),
  public.finanzas_mas_vendidos(date, date, int)
from public, anon;

grant execute on function
  public.finanzas_por_mes(date, date),
  public.finanzas_mas_vendidos(date, date, int)
to authenticated;
