-- =============================================
-- HERA STORE — Notifications System
-- =============================================

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null default 'info' check (type in ('order', 'payment', 'review', 'system', 'info')),
  title text not null,
  message text,
  link text,
  is_read boolean default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_id on public.notifications(user_id);
create index idx_notifications_unread on public.notifications(is_read) where is_read = false;

alter table public.notifications enable row level security;

-- Admins can view all notifications
create policy "Admins can view all notifications"
  on public.notifications for select to authenticated
  using (public.has_role(auth.uid(), array['super_admin', 'admin', 'operator', 'finance']));

-- Admins can update notifications (mark read)
create policy "Admins can update notifications"
  on public.notifications for update to authenticated
  using (public.has_role(auth.uid(), array['super_admin', 'admin', 'operator', 'finance']))
  with check (public.has_role(auth.uid(), array['super_admin', 'admin', 'operator', 'finance']));

-- Admins can insert notifications
create policy "Admins can insert notifications"
  on public.notifications for insert to authenticated
  with check (true);

-- Users can view own notifications
create policy "Users can view own notifications"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

-- Users can update own notifications
create policy "Users can update own notifications"
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Auto-create notification when order status changes
create or replace function public.handle_order_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_title text;
  v_message text;
  v_type text := 'order';
begin
  if NEW.status = 'diproses' then
    v_title := 'Pesanan Diproses';
    v_message := 'Pesanan ' || NEW.order_number || ' sedang diproses.';
  elsif NEW.status = 'dikirim' then
    v_title := 'Pesanan Dikirim';
    v_message := 'Pesanan ' || NEW.order_number || ' telah dikirim.' || case when NEW.tracking_number is not null then ' Resi: ' || NEW.tracking_number else '' end;
  elsif NEW.status = 'selesai' then
    v_title := 'Pesanan Selesai';
    v_message := 'Pesanan ' || NEW.order_number || ' telah selesai. Terima kasih!';
  elsif NEW.status = 'dibatalkan' then
    v_title := 'Pesanan Dibatalkan';
    v_message := 'Pesanan ' || NEW.order_number || ' telah dibatalkan.';
  else
    return NEW;
  end if;

  -- Notify the order owner
  if NEW.user_id is not null then
    insert into public.notifications (user_id, type, title, message, link)
    values (NEW.user_id, 'order', v_title, v_message, '/profil?tab=pesanan');
  end if;

  -- Notify all admins
  insert into public.notifications (user_id, type, title, message, link)
  select p.id, 'order', 'Pesanan ' || NEW.status, 'Pesanan ' || NEW.order_number || ' status: ' || NEW.status, '/admin/pesanan'
  from public.profiles p
  where p.role in ('super_admin', 'admin', 'operator')
    and p.id != NEW.user_id;

  return NEW;
end;
$$;

drop trigger if exists on_order_status_change on public.orders;
create trigger on_order_status_change
  after update of status on public.orders
  for each row
  when (OLD.status is distinct from NEW.status)
  execute procedure public.handle_order_status_change();
