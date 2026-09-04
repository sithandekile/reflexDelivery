-- Reflex Delivery System — Supabase schema


-- Roles: retailer, dispatcher, rider
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  role text not null check (role in ('retailer', 'dispatcher', 'rider')),
  phone text,
  created_at timestamptz default now()
);

-- A delivery order created by a retailer
create table if not exists deliveries (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid not null references users(id),
  pickup_address text not null,
  dropoff_address text not null,
  package_note text,
  status text not null default 'pending'
    check (status in ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Which rider is assigned to which delivery, and by whom (dispatcher)
create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references deliveries(id) on delete cascade,
  rider_id uuid not null references users(id),
  dispatcher_id uuid not null references users(id),
  assigned_at timestamptz default now()
);

-- Full status history per delivery (audit trail / timeline)
create table if not exists status_updates (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references deliveries(id) on delete cascade,
  status text not null,
  updated_by uuid references users(id),
  note text,
  created_at timestamptz default now()
);

-- Keep deliveries.updated_at fresh whenever status changes
create or replace function touch_delivery_updated_at()
returns trigger as $$
begin
  update deliveries set updated_at = now() where id = new.delivery_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_delivery on status_updates;
create trigger trg_touch_delivery
after insert on status_updates
for each row execute function touch_delivery_updated_at();

-- Helpful indexes for the dispatcher board
create index if not exists idx_deliveries_status on deliveries(status);
create index if not exists idx_assignments_delivery on assignments(delivery_id);
create index if not exists idx_status_updates_delivery on status_updates(delivery_id);
