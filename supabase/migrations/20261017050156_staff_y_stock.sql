-- Personal del panel e historial de stock.
-- Reglas en claude/supabase/seguridad-rls.md y claude/supabase/variantes-y-stock.md#historial-de-stock

-- ===========================================================================
-- 1. Staff (reemplaza a `admins`)
-- ===========================================================================
-- Estar logueado no da ningún permiso: lo que da permisos es tener una fila ACTIVA en
-- `staff`. Todo el staff es administrador del panel (no hay roles).

create table public.staff (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  email     text not null,                         -- copia para listar en el panel
  nombre    text not null check (length(trim(nombre)) between 1 and 80),
  activo    boolean not null default true,
  creado_en timestamptz not null default now()
);

insert into public.staff (user_id, email, nombre)
select a.user_id, u.email, coalesce(nullif(split_part(u.email, '@', 1), ''), 'Admin')
from public.admins a
join auth.users u on u.id = a.user_id;

-- es_admin() mantiene su nombre: la usan todas las policies del panel.
create or replace function private.es_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff where user_id = (select auth.uid()) and activo
  )
$$;

-- Un usuario por email. Definer: lee auth.users. En `private`: la API no la expone, sólo
-- la llaman funciones que antes verificaron que quien pregunta es admin.
create function private.usuario_por_email(p_email text)
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select id from auth.users where lower(email) = lower(trim(p_email)) limit 1
$$;

-- Alta desde el panel, sin la secret key: el usuario tiene que existir (creado con el
-- script o registrado en Auth). Invoker: la escritura pasa por RLS.
create function public.asignar_staff(p_email text, p_nombre text, p_activo boolean default true)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not (select private.es_admin()) then
    raise exception 'Sólo un admin puede administrar el personal';
  end if;
  v_id := private.usuario_por_email(p_email);
  if v_id is null then
    raise exception 'No hay ningún usuario con el email %: primero tiene que crear su cuenta', trim(p_email);
  end if;
  insert into public.staff (user_id, email, nombre, activo)
  values (v_id, lower(trim(p_email)), trim(p_nombre), p_activo)
  on conflict (user_id) do update
    set email = excluded.email, nombre = excluded.nombre, activo = excluded.activo;
  return v_id;
end;
$$;

-- Nunca queda el sistema sin un admin activo (nadie podría volver a entrar al panel).
create function private.validar_ultimo_admin()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.activo
     and (tg_op = 'DELETE' or not new.activo)
     and not exists (
       select 1 from public.staff where activo and user_id <> old.user_id
     ) then
    raise exception 'Tiene que quedar al menos un admin activo';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger staff_ultimo_admin
before update or delete on public.staff
for each row execute function private.validar_ultimo_admin();

grant select, insert, update, delete on public.staff to authenticated;
alter table public.staff enable row level security;
create policy "cada uno se ve, admin ve todo" on public.staff for select to authenticated
  using (user_id = (select auth.uid()) or (select private.es_admin()));
create policy "admin inserta" on public.staff for insert to authenticated with check ((select private.es_admin()));
create policy "admin actualiza" on public.staff for update to authenticated
  using ((select private.es_admin())) with check ((select private.es_admin()));
create policy "admin borra" on public.staff for delete to authenticated using ((select private.es_admin()));

drop table public.admins;

-- ===========================================================================
-- 2. Historial de stock
-- ===========================================================================
-- Cada cambio de producto_variantes.stock deja una fila. Lo escribe un TRIGGER, no cada
-- función: así ningún camino (panel, pedido, SQL a mano) puede saltearse el registro.
-- Quien cambia el stock dice el motivo con
--   set_config('app.motivo_stock', 'pedido', true)   -- y app.referencia_stock / app.detalle_stock
-- (local a la transacción); sin motivo, queda como 'ajuste'.

create type public.motivo_stock as enum ('alta', 'ajuste', 'ingreso', 'pedido');

create table public.movimientos_stock (
  id               bigint generated always as identity primary key,
  variante_id      uuid references public.producto_variantes (id) on delete set null,
  producto_id      uuid references public.productos (id) on delete set null,
  cantidad         int not null check (cantidad <> 0),   -- + entra, − sale
  stock_resultante int not null,
  motivo           public.motivo_stock not null,
  referencia       uuid,                                  -- pedido
  detalle          text,
  usuario_id       uuid default auth.uid(),
  creado_en        timestamptz not null default now()
);
create index movimientos_stock_variante_idx on public.movimientos_stock (variante_id, creado_en desc);
create index movimientos_stock_producto_idx on public.movimientos_stock (producto_id, creado_en desc);
create index movimientos_stock_referencia_idx on public.movimientos_stock (referencia);

-- Sólo lectura por la API, sólo admin. Nadie inserta por HTTP: sólo el trigger.
grant select on public.movimientos_stock to authenticated;
alter table public.movimientos_stock enable row level security;
create policy "admin lee" on public.movimientos_stock for select to authenticated
  using ((select private.es_admin()));

create function private.registrar_movimiento_stock()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_delta  int := new.stock - coalesce(case when tg_op = 'UPDATE' then old.stock end, 0);
  v_motivo text := nullif(current_setting('app.motivo_stock', true), '');
begin
  if v_delta = 0 then
    return null;
  end if;
  insert into public.movimientos_stock (variante_id, producto_id, cantidad, stock_resultante, motivo, referencia, detalle)
  values (
    new.id,
    new.producto_id,
    v_delta,
    new.stock,
    coalesce(v_motivo, case when tg_op = 'INSERT' then 'alta' else 'ajuste' end)::public.motivo_stock,
    nullif(current_setting('app.referencia_stock', true), '')::uuid,
    nullif(current_setting('app.detalle_stock', true), '')
  );
  return null;
end;
$$;

create trigger producto_variantes_movimiento_stock
after insert or update of stock on public.producto_variantes
for each row execute function private.registrar_movimiento_stock();

-- ===========================================================================
-- 3. guardar_variantes: stock sin pisar pedidos confirmados en el medio
-- ===========================================================================
-- Antes el panel mandaba el stock que leyó al abrir el editor y lo pisaba: si en el medio
-- se confirmaba un pedido, el guardado lo "deshacía". Ahora cada fila trae
-- `stock_original` (lo que leyó el panel):
--   * si el stock que manda es igual al original, el admin no lo tocó: queda el actual;
--   * si lo cambió pero el stock real ya no es el original, algo lo movió en el medio:
--     se rechaza todo y el panel pide recargar.
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

  -- 2. Borrar primero las que no vienen (libera sus SKU).
  delete from public.producto_variantes
  where producto_id = p_producto_id and clave <> all (v_claves);

  -- 3. Crear o actualizar cada una y reescribir sus etiquetas.
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

    v_orden := v_orden + 1;
  end loop;
end;
$$;

-- ===========================================================================
-- 4. cambiar_estado_pedido: registra sus movimientos (igual que antes en lo demás)
-- ===========================================================================
create or replace function public.cambiar_estado_pedido(p_pedido_id uuid, p_estado public.estado_pedido)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_actual    public.estado_pedido;
  v_numero    bigint;
  v_cupon     uuid;
  r           record;
  v_descontar boolean;
  v_reponer   boolean;
begin
  if not (select private.es_admin()) then
    raise exception 'Sólo administradores';
  end if;

  select estado, numero, cupon_id into v_actual, v_numero, v_cupon from public.pedidos where id = p_pedido_id for update;
  if v_actual is null then
    raise exception 'Pedido inexistente';
  end if;
  if v_actual = p_estado then
    return;
  end if;

  v_descontar := p_estado in ('confirmado', 'entregado') and v_actual in ('pendiente', 'cancelado');
  v_reponer   := p_estado in ('pendiente', 'cancelado') and v_actual in ('confirmado', 'entregado');

  perform set_config('app.motivo_stock', 'pedido', true);
  perform set_config('app.referencia_stock', p_pedido_id::text, true);
  perform set_config('app.detalle_stock', 'Pedido #' || v_numero || ': ' || p_estado::text, true);

  if v_descontar then
    -- En orden de id: dos operaciones sobre las mismas variantes nunca se bloquean entre sí.
    for r in select variante_id, sum(cantidad)::int as cantidad, min(descripcion) as descripcion
               from public.pedido_items
              where pedido_id = p_pedido_id and variante_id is not null
              group by variante_id
              order by variante_id
    loop
      update public.producto_variantes
         set stock = stock - r.cantidad
       where id = r.variante_id and stock >= r.cantidad;
      if not found then
        raise exception 'No hay stock suficiente de "%" para confirmar el pedido', r.descripcion;
      end if;
    end loop;
  elsif v_reponer then
    for r in select variante_id, sum(cantidad)::int as cantidad
               from public.pedido_items
              where pedido_id = p_pedido_id and variante_id is not null
              group by variante_id
              order by variante_id
    loop
      update public.producto_variantes set stock = stock + r.cantidad where id = r.variante_id;
    end loop;
  end if;

  if v_cupon is not null then
    if p_estado = 'cancelado' then
      update public.cupones set usos = greatest(usos - 1, 0) where id = v_cupon;
    elsif v_actual = 'cancelado' then
      update public.cupones set usos = usos + 1
      where id = v_cupon and (usos_maximos is null or usos < usos_maximos);
      if not found then
        raise exception 'El cupón del pedido ya no tiene usos disponibles: no se puede reactivar';
      end if;
    end if;
  end if;

  update public.pedidos set estado = p_estado where id = p_pedido_id;
end;
$$;

-- ===========================================================================
-- Grants de funciones
-- ===========================================================================
revoke execute on function
  private.usuario_por_email(text),
  private.validar_ultimo_admin(),
  private.registrar_movimiento_stock(),
  public.asignar_staff(text, text, boolean)
from public, anon;

grant execute on function
  private.usuario_por_email(text),
  public.asignar_staff(text, text, boolean)
to authenticated;
