-- ============================================================
-- LUX ADVANCE — SEGURANÇA DA ÁREA ADMINISTRATIVA (RLS + MFA)
-- ============================================================
-- COMO EXECUTAR:
--   1. Ative o MFA TOTP: Supabase > Authentication > Multi-Factor.
--   2. Abra Supabase > SQL Editor > New query.
--   3. Cole TODO este arquivo e clique em RUN (pode rodar mais de uma vez).
--   4. Cadastre o primeiro admin (rode separado, trocando o e-mail):
--
--        insert into public.admins (user_id)
--        select id from auth.users
--        where email = 'SEU-EMAIL-ADMIN@exemplo.com'
--        on conflict do nothing;
--
--   O usuário precisa existir antes (Authentication > Users).
--   NUNCA coloque a chave service_role no front-end.
--
-- COMO FUNCIONA:
--   * public.admins só pode ser alterada pelo SQL Editor / service role.
--   * public.is_admin() = usuário está em admins E o JWT é aal2 (2FA feito).
--   * public.meu_tipo() (usada pelas políticas antigas do SUPABASE.sql)
--     passa a devolver 'admin' somente se is_admin() for verdadeiro;
--     assim as políticas antigas também exigem 2FA.
--   * Políticas de usuários comuns (modelo edita o próprio cadastro,
--     vitrine pública de aprovadas, etc.) NÃO são alteradas.
-- ============================================================


-- ------------------------------------------------------------
-- TABELA DE ADMINS (sem nenhuma policy = ninguém via API altera)
-- ------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now()
);

alter table public.admins enable row level security;

revoke all on public.admins from anon, authenticated;


-- ------------------------------------------------------------
-- sou_admin(): está na tabela admins (usado antes do 2FA, no login)
-- ------------------------------------------------------------
create or replace function public.sou_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;


-- ------------------------------------------------------------
-- is_admin(): admin + 2FA concluído (aal2)
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.admins where user_id = auth.uid()
    )
    and coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

revoke all on function public.sou_admin() from public, anon;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.sou_admin() to authenticated;
grant execute on function public.is_admin() to authenticated;


-- ------------------------------------------------------------
-- meu_tipo(): 'admin' só vale com is_admin() verdadeiro
-- ------------------------------------------------------------
create or replace function public.meu_tipo()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when tipo = 'admin' then
      case when public.is_admin() then 'admin' else 'usuario' end
    else tipo
  end
  from public.perfis
  where id = auth.uid();
$$;


-- ------------------------------------------------------------
-- Impede que usuário comum se torne admin pelo perfil
-- (a política antiga já restringe tipo a usuario/modelo; este
--  trigger reforça para qualquer UPDATE feito via API).
-- ------------------------------------------------------------
create or replace function public.bloquear_troca_tipo_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tipo is distinct from old.tipo
     and (new.tipo = 'admin' or old.tipo = 'admin')
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Alteração de tipo administrativo não permitida.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_bloquear_troca_tipo_admin on public.perfis;

create trigger trg_bloquear_troca_tipo_admin
before update on public.perfis
for each row
execute function public.bloquear_troca_tipo_admin();


-- ------------------------------------------------------------
-- POLÍTICAS ADMINISTRATIVAS (somente is_admin())
-- Tabelas inexistentes são ignoradas.
-- Políticas permissivas são somadas às de usuários comuns.
-- ------------------------------------------------------------
do $$
declare
  t text;
  tabelas text[] := array[
    'perfis',
    'modelo_perfis',
    'avaliacoes_modelos',
    'avaliacoes',
    'reclamacoes',
    'assinaturas',
    'doacoes',
    'pagamentos_planos',
    'pagamentos',
    'pre_cadastros'
  ];
begin
  foreach t in array tabelas loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists "admin 2fa total" on public.%I', t);
      execute format(
        'create policy "admin 2fa total" on public.%I
           for all to authenticated
           using (public.is_admin())
           with check (public.is_admin())',
        t
      );
    end if;
  end loop;
end
$$;

-- Fim. Teste: logue como usuário comum e tente
--   select * from public.admins;   -- deve falhar/retornar vazio
--   select * from public.doacoes;  -- deve retornar vazio
