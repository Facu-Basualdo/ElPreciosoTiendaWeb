-- Productos hechos a pedido: no se controla stock.
-- Regla y porqué en claude/supabase/variantes-y-stock.md#productos-a-pedido
--
-- En vez de enseñarle "a pedido" a cada función que mira el stock (buscar_productos,
-- facetas, filtros por variante, cotizar, combos…), un trigger fija el stock de las
-- variantes de esos productos en 9999: para todas ellas el producto está siempre
-- disponible. Sólo cambiar_estado_pedido y el historial los tratan aparte.

alter table public.productos add column a_pedido boolean not null default true;
comment on column public.productos.a_pedido is
  'Hecho a pedido: no se controla stock (sus variantes quedan en 9999 por trigger).';

-- ===========================================================================
-- 1. Stock fijo en las variantes de productos a pedido
-- ===========================================================================
create function private.fijar_stock_a_pedido()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select p.a_pedido from public.productos p where p.id = new.producto_id) then
    new.stock := 9999;
  end if;
  return new;
end;
$$;

create trigger producto_variantes_stock_a_pedido
before insert or update of stock on public.producto_variantes
for each row execute function private.fijar_stock_a_pedido();

-- Al marcar o desmarcar "a pedido": 9999, o 0 para que se cargue el stock real.
create function private.cambiar_a_pedido()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.a_pedido is distinct from old.a_pedido then
    perform set_config('app.sin_historial', 'si', true);
    update public.producto_variantes
       set stock = case when new.a_pedido then 9999 else 0 end
     where producto_id = new.id;
    perform set_config('app.sin_historial', '', true);
  end if;
  return null;
end;
$$;

create trigger productos_cambiar_a_pedido
after update of a_pedido on public.productos
for each row execute function private.cambiar_a_pedido();

-- ===========================================================================
-- 2. Historial: los productos a pedido no registran movimientos
-- ===========================================================================
create or replace function private.registrar_movimiento_stock()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_delta  int := new.stock - coalesce(case when tg_op = 'UPDATE' then old.stock end, 0);
  v_motivo text := nullif(current_setting('app.motivo_stock', true), '');
begin
  if v_delta = 0
     or current_setting('app.sin_historial', true) = 'si'
     or (select p.a_pedido from public.productos p where p.id = new.producto_id) then
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

-- ===========================================================================
-- 3. cambiar_estado_pedido: no descuenta ni repone productos a pedido
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
    for r in select i.variante_id, sum(i.cantidad)::int as cantidad, min(i.descripcion) as descripcion
               from public.pedido_items i
               join public.producto_variantes v on v.id = i.variante_id
               join public.productos p on p.id = v.producto_id
              where i.pedido_id = p_pedido_id and not p.a_pedido
              group by i.variante_id
              order by i.variante_id
    loop
      update public.producto_variantes
         set stock = stock - r.cantidad
       where id = r.variante_id and stock >= r.cantidad;
      if not found then
        raise exception 'No hay stock suficiente de "%" para confirmar el pedido', r.descripcion;
      end if;
    end loop;
  elsif v_reponer then
    for r in select i.variante_id, sum(i.cantidad)::int as cantidad
               from public.pedido_items i
               join public.producto_variantes v on v.id = i.variante_id
               join public.productos p on p.id = v.producto_id
              where i.pedido_id = p_pedido_id and not p.a_pedido
              group by i.variante_id
              order by i.variante_id
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
-- 4. Datos existentes y grants
-- ===========================================================================
do $$
begin
  perform set_config('app.sin_historial', 'si', true);
  update public.producto_variantes v
     set stock = 9999
    from public.productos p
   where p.id = v.producto_id and p.a_pedido;
end;
$$;

revoke execute on function
  private.fijar_stock_a_pedido(),
  private.cambiar_a_pedido()
from public, anon;
