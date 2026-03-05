-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Clients
create table clients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  company text,
  address text,
  city text,
  country text default 'Belgique',
  vat_number text,
  created_at timestamptz default now()
);
alter table clients enable row level security;
create policy "Users manage own clients" on clients for all using (auth.uid() = user_id);

-- Projects
create table projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  name text not null,
  description text,
  status text default 'active' check (status in ('active','paused','completed')),
  budget numeric(10,2),
  start_date date,
  end_date date,
  created_at timestamptz default now()
);
alter table projects enable row level security;
create policy "Users manage own projects" on projects for all using (auth.uid() = user_id);

-- Invoices
create table invoices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  number text not null,
  status text default 'draft' check (status in ('draft','sent','paid','cancelled')),
  issue_date date,
  due_date date,
  subtotal numeric(10,2) default 0,
  tax_rate numeric(5,2) default 21,
  tax_amount numeric(10,2) default 0,
  total numeric(10,2) default 0,
  notes text,
  created_at timestamptz default now()
);
alter table invoices enable row level security;
create policy "Users manage own invoices" on invoices for all using (auth.uid() = user_id);

-- Invoice Items
create table invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references invoices(id) on delete cascade not null,
  description text not null,
  quantity numeric(10,2) default 1,
  unit_price numeric(10,2) default 0,
  total numeric(10,2) generated always as (quantity * unit_price) stored
);
alter table invoice_items enable row level security;
create policy "Users manage own invoice items" on invoice_items for all
  using (exists (select 1 from invoices where id = invoice_items.invoice_id and user_id = auth.uid()));

-- Expenses
create table expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  description text not null,
  amount numeric(10,2) not null,
  category text,
  date date not null,
  created_at timestamptz default now()
);
alter table expenses enable row level security;
create policy "Users manage own expenses" on expenses for all using (auth.uid() = user_id);

-- Time Entries
create table time_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references projects(id) on delete set null,
  description text,
  hours numeric(5,2) not null,
  date date not null,
  created_at timestamptz default now()
);
alter table time_entries enable row level security;
create policy "Users manage own time entries" on time_entries for all using (auth.uid() = user_id);

-- Settings
create table settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_name text,
  email text,
  phone text,
  address text,
  siret text,
  vat_number text,
  iban text,
  bic text,
  default_tax_rate numeric(5,2) default 21,
  payment_terms int default 30,
  updated_at timestamptz default now()
);
alter table settings enable row level security;
create policy "Users manage own settings" on settings for all using (auth.uid() = user_id);
