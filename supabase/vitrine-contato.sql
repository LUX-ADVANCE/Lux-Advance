-- Execute no SQL Editor do Supabase antes de publicar a vitrine.
-- Esta migração não altera os dados existentes; NÃO execute automaticamente em produção.

alter table public.modelo_perfis
  add column if not exists whatsapp text,
  add column if not exists estado text,
  add column if not exists categoria_catalogo text;

-- Copia somente os campos necessários do metadata privado do Auth para o perfil.
create or replace function public.preencher_metadata_modelo()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  metadata jsonb;
begin
  select u.raw_user_meta_data into metadata
  from auth.users as u
  where u.id = new.id;

  new.whatsapp := coalesce(nullif(new.whatsapp, ''), nullif(metadata->>'whatsapp', ''));
  new.estado := coalesce(nullif(new.estado, ''), nullif(metadata->>'estado', ''));
  new.categoria_catalogo := coalesce(
    nullif(new.categoria_catalogo, ''),
    nullif(metadata->>'categoria_catalogo', '')
  );
  return new;
end;
$$;

revoke all on function public.preencher_metadata_modelo() from public, anon, authenticated;
drop trigger if exists trg_modelo_perfis_metadata on public.modelo_perfis;
create trigger trg_modelo_perfis_metadata
before insert on public.modelo_perfis
for each row execute function public.preencher_metadata_modelo();

update public.modelo_perfis as mp
set whatsapp = coalesce(nullif(mp.whatsapp, ''), nullif(u.raw_user_meta_data->>'whatsapp', '')),
    estado = coalesce(nullif(mp.estado, ''), nullif(u.raw_user_meta_data->>'estado', '')),
    categoria_catalogo = coalesce(
      nullif(mp.categoria_catalogo, ''),
      nullif(u.raw_user_meta_data->>'categoria_catalogo', '')
    )
from auth.users as u
where u.id = mp.id
  and (
    nullif(mp.whatsapp, '') is null
    or nullif(mp.estado, '') is null
    or nullif(mp.categoria_catalogo, '') is null
  );

-- A listagem anônima recebe somente os campos públicos; whatsapp nunca é enviado ao navegador.
revoke select on table public.modelo_perfis from public, anon;
revoke select (whatsapp) on table public.modelo_perfis from public, anon;
grant select (
  id, nome_exibicao, idade, cidade, estado, pais, cor_cabelo, cor_olhos,
  altura_cm, idiomas, descricao, foto_url, galeria_urls,
  maioridade_confirmada, verificacao_status, estrelas_total, criado_em,
  atualizado_em, plano_codigo, plano_nome, plano_status, selo_codigo,
  categoria_catalogo
) on table public.modelo_perfis to anon;

-- Contas autenticadas conservam o acesso permitido pelas políticas RLS existentes.
grant select on table public.modelo_perfis to authenticated;

create or replace function public.obter_contato_modelo(p_modelo_id uuid)
returns table (whatsapp text)
language sql
security definer
set search_path = pg_catalog, public
as $$
  select mp.whatsapp
  from public.modelo_perfis as mp
  join public.perfis as p on p.id = mp.id
  where mp.id = p_modelo_id
    and auth.uid() is not null
    and mp.verificacao_status in ('verificada', 'verificado', 'aprovada', 'aprovado')
    and p.status in ('ativo', 'aprovado')
    and nullif(regexp_replace(coalesce(mp.whatsapp, ''), '\D', '', 'g'), '') is not null
  limit 1;
$$;

revoke all on function public.obter_contato_modelo(uuid) from public, anon;
grant execute on function public.obter_contato_modelo(uuid) to authenticated;

-- Chaves de idempotência usadas pela Edge Function para não reenviar o mesmo evento.
create table if not exists public.notificacoes_modelo_pendente (
  evento_id text primary key,
  criada_em timestamptz not null default now()
);
alter table public.notificacoes_modelo_pendente enable row level security;
revoke all on table public.notificacoes_modelo_pendente from public, anon, authenticated;
grant all on table public.notificacoes_modelo_pendente to service_role;

-- Garante uma versão única por transição de status para deduplicação de webhooks repetidos.
create or replace function public.atualizar_modelo_perfil_atualizado_em()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

revoke all on function public.atualizar_modelo_perfil_atualizado_em() from public, anon, authenticated;
drop trigger if exists trg_modelo_perfis_atualizado_em on public.modelo_perfis;
create trigger trg_modelo_perfis_atualizado_em
before update on public.modelo_perfis
for each row execute function public.atualizar_modelo_perfil_atualizado_em();

-- Permite ao Database Webhook comparar o status anterior em eventos UPDATE.
alter table public.modelo_perfis replica identity full;
