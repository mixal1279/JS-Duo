-- Harden the auth trigger against object shadowing while preserving its behavior.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
declare
  base_name text;
begin
  base_name := lower(regexp_replace(
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      split_part(coalesce(new.email, 'programista'), '@', 1)
    ),
    '[^a-zA-Z0-9_]', '', 'g'
  ));

  if char_length(base_name) < 3 then
    base_name := 'coder';
  end if;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    left(base_name, 24) || '_' || left(replace(new.id::text, '-', ''), 6),
    left(coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), base_name), 40)
  )
  on conflict (id) do nothing;

  return new;
end;
$function$;
