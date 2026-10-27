-- Repair the trigger function from the historical foundation migration.
-- Replacing the function is non-destructive and preserves the existing trigger.
create or replace function public.touch_friend_request_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
