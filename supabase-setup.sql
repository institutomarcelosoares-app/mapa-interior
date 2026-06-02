-- Execute esse SQL no Supabase > SQL Editor

create table clientes (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  email text not null,
  token text unique not null,
  status text default 'pendente',  -- pendente | respondido | entregue
  indicado_por text,
  criado_em timestamptz default now(),
  respondido_em timestamptz
);

create table relatorios (
  id uuid default gen_random_uuid() primary key,
  cliente_id uuid references clientes(id),
  nome text,
  email text,
  perfil_sintese text,
  temperamento_tipo text,
  temperamento_desc text,
  disc_quadrante text,
  disc_desc text,
  eneagrama_tipo text,
  eneagrama_tipo2 text,
  eneagrama_desc text,
  padrao_mecanismo text,
  padrao_desc text,
  pontos_cegos text,
  potencial_latente text,
  pauta_devolutiva text,
  respostas jsonb,
  criado_em timestamptz default now()
);

create table indicacoes (
  id uuid default gen_random_uuid() primary key,
  cliente_email text,
  indicado_email text,
  criado_em timestamptz default now()
);

-- Índices para busca rápida
create index on clientes(token);
create index on clientes(email);
create index on relatorios(cliente_id);
