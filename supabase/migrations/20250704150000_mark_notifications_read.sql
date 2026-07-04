-- Run in Supabase SQL Editor if "Mark all read" on Alerts does nothing.

create or replace function public.mark_notifications_read(
  p_notification_id uuid default null,
  p_mark_all boolean default false
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if p_mark_all then
    update public.notifications
    set read_at = now()
    where recipient_user_id = auth.uid()
      and read_at is null;
    get diagnostics v_count = row_count;
    return v_count;
  end if;

  if p_notification_id is null then
    raise exception 'notification id required';
  end if;

  update public.notifications
  set read_at = now()
  where id = p_notification_id
    and recipient_user_id = auth.uid()
    and read_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.mark_notifications_read(uuid, boolean) from public;
grant execute on function public.mark_notifications_read(uuid, boolean) to authenticated;
grant execute on function public.mark_notifications_read(uuid, boolean) to service_role;
