-- Pedidos: WhatsApp del cliente (opcional) y forma de entrega (retiro o envío).
-- El panel abre el chat con el cliente desde el pedido. Ver claude/supabase/carrito.md

alter table public.pedidos
  add column telefono  text check (telefono ~ '^[0-9]{8,15}$'),   -- sólo dígitos, como wa.me
  add column entrega   text not null default 'retiro' check (entrega in ('retiro', 'envio')),
  add column localidad text check (length(trim(localidad)) between 2 and 80);

-- Parámetros nuevos al final y con default: el carrito viejo (sin ellos) sigue andando.
-- Agregar parámetros crea otra sobrecarga: primero se borra la firma anterior.
drop function public.crear_pedido(jsonb, text, text, text);
create function public.crear_pedido(
  p_items     jsonb,
  p_nombre    text,
  p_notas     text default null,
  p_cupon     text default null,
  p_telefono  text default null,
  p_entrega   text default 'retiro',
  p_localidad text default null
)
returns jsonb
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_cot      jsonb;
  v_pedido   public.pedidos;
  v_padre    uuid;
  v_cupon    uuid;
  v_telefono text := nullif(regexp_replace(coalesce(p_telefono, ''), '\D', '', 'g'), '');
  v_entrega  text := coalesce(nullif(trim(p_entrega), ''), 'retiro');
  v_localidad text := nullif(trim(coalesce(p_localidad, '')), '');
  l          jsonb;
  n          bigint;
begin
  if length(trim(coalesce(p_nombre, ''))) not between 1 and 80 then
    raise exception 'Ingresá tu nombre (hasta 80 caracteres)';
  end if;
  if length(coalesce(p_notas, '')) > 500 then
    raise exception 'Las notas admiten hasta 500 caracteres';
  end if;
  if v_telefono is not null and length(v_telefono) not between 8 and 15 then
    raise exception 'Revisá tu número de WhatsApp: con característica, sin 0 ni 15 (por ejemplo 3624123456)';
  end if;
  if v_entrega not in ('retiro', 'envio') then
    raise exception 'Elegí retiro o envío';
  end if;
  if v_entrega = 'envio' and (v_localidad is null or length(v_localidad) not between 2 and 80) then
    raise exception 'Para el envío, escribí tu localidad';
  end if;

  v_cot := private.cotizar_con_cupon(p_items, p_cupon);

  if jsonb_array_length(v_cot -> 'lineas') = 0 then
    raise exception 'El carrito está vacío';
  end if;
  if exists (select 1 from jsonb_array_elements(v_cot -> 'lineas') x where x ->> 'estado' <> 'ok') then
    raise exception 'Hay productos sin stock o que ya no están disponibles: revisá el carrito';
  end if;
  -- Si el cliente puso un cupón y no vale, no se crea el pedido con otro total.
  if v_cot ->> 'cupon_error' is not null then
    raise exception '%', v_cot ->> 'cupon_error';
  end if;

  -- Uso del cupón: atómico, sin carreras entre dos pedidos por el último uso.
  v_cupon := (v_cot ->> 'cupon_id')::uuid;
  if v_cupon is not null then
    update public.cupones set usos = usos + 1
    where id = v_cupon and (usos_maximos is null or usos < usos_maximos);
    if not found then
      raise exception 'El cupón no es válido o ya venció';
    end if;
  end if;

  insert into public.pedidos
    (nombre, notas, telefono, entrega, localidad, subtotal, descuento_promociones, descuento_cupon, total, cupon_id, cupon_codigo)
  values (
    trim(p_nombre),
    nullif(trim(coalesce(p_notas, '')), ''),
    v_telefono,
    v_entrega,
    case when v_entrega = 'envio' then v_localidad end,
    (v_cot ->> 'subtotal')::numeric,
    (v_cot ->> 'descuento_promociones')::numeric,
    (v_cot ->> 'descuento_cupon')::numeric,
    (v_cot ->> 'total')::numeric,
    v_cupon,
    v_cot -> 'cupon' ->> 'codigo'
  )
  returning * into v_pedido;

  for l, n in select t.l, t.n from jsonb_array_elements(v_cot -> 'lineas') with ordinality as t(l, n) loop
    if l ->> 'tipo' = 'combo' then
      insert into public.pedido_items
        (pedido_id, combo_id, descripcion, detalle, cantidad, precio_unitario, descuento, subtotal, orden)
      values (v_pedido.id, (l ->> 'combo_id')::uuid, l ->> 'nombre', l ->> 'detalle', (l ->> 'cantidad')::int,
              (l ->> 'precio_unitario')::numeric, 0, (l ->> 'subtotal')::numeric, (n - 1)::int)
      returning id into v_padre;
      insert into public.pedido_items
        (pedido_id, padre_id, variante_id, producto_id, descripcion, detalle, sku, cantidad, precio_unitario, descuento, subtotal, orden)
      select v_pedido.id, v_padre, (it ->> 'variante_id')::uuid, (it ->> 'producto_id')::uuid, it ->> 'nombre',
             it ->> 'detalle', it ->> 'sku', (it ->> 'cantidad')::int * (l ->> 'cantidad')::int, 0, 0, 0, (m - 1)::int
      from jsonb_array_elements(l -> 'items') with ordinality as t(it, m);
    else
      insert into public.pedido_items
        (pedido_id, variante_id, producto_id, descripcion, detalle, sku, cantidad, precio_unitario, descuento, subtotal, promo, orden)
      values (v_pedido.id, (l ->> 'variante_id')::uuid, (l ->> 'producto_id')::uuid, l ->> 'nombre', l ->> 'detalle',
              l ->> 'sku', (l ->> 'cantidad')::int, (l ->> 'precio_unitario')::numeric, (l ->> 'descuento')::numeric,
              (l ->> 'subtotal')::numeric, l ->> 'promo', (n - 1)::int);
    end if;
  end loop;

  return (v_cot - 'cupon_id') || jsonb_build_object('id', v_pedido.id, 'numero', v_pedido.numero);
end;
$$;

revoke execute on function public.crear_pedido(jsonb, text, text, text, text, text, text) from public;
grant execute on function public.crear_pedido(jsonb, text, text, text, text, text, text) to anon, authenticated;
