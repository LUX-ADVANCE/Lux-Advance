# Segurança da Área Administrativa — LUX ADVANCE

O acesso ao painel exige **e-mail + senha + código de 6 dígitos (2FA/TOTP)**.
A proteção real fica no Supabase (RLS); o JavaScript apenas guia o usuário.

## 1. Ativar o MFA no Supabase
1. Painel do Supabase → **Authentication → Multi-Factor** (ou *Sign In / Providers → Multi-Factor*).
2. Habilite **TOTP** (enroll e verify).

## 2. Rodar o SQL
1. Supabase → **SQL Editor → New query**.
2. Cole o conteúdo de `supabase/seguranca-admin.sql` e clique em **Run**.
3. O script cria `public.admins`, `public.sou_admin()`, `public.is_admin()` (admin + `aal2`),
   ajusta `public.meu_tipo()` e cria políticas "admin 2fa total" nas tabelas do painel.
   Políticas de usuários comuns (modelo edita o próprio cadastro, vitrine pública) continuam iguais.

## 3. Cadastrar o primeiro admin
Crie o usuário em **Authentication → Users** e, no SQL Editor:

```sql
insert into public.admins (user_id)
select id from auth.users
where email = 'SEU-EMAIL-ADMIN@exemplo.com'
on conflict do nothing;
```

## 4. Primeiro acesso
Abra `acesso-admin.html`, entre com e-mail e senha. No primeiro acesso aparece um QR Code:
escaneie no Google Authenticator/Authy e confirme o código. Nos próximos acessos, basta digitar o código.

## 5. Proteções do front-end
- Painel oculto até validar sessão, admin no banco (`is_admin()`) e `aal2` (`admin-guard.js`).
- Logout automático após 15 min de inatividade, com aviso de 1 min.
- Cooldown progressivo após falhas de login/código e mensagens genéricas.
- Botão **Sair** encerra a sessão; `noindex, nofollow` no painel.
- Nenhuma chave `service_role` no código. `LUX_ADMIN_EMAIL` não é mais usado para autorização.

## 6. Perdi o celular
1. No Supabase → **Authentication → Users**, abra o usuário admin.
2. Remova o fator MFA (TOTP) dele (ou rode `delete from auth.mfa_factors where user_id = '<uuid>';` no SQL Editor).
3. Entre novamente: será pedido um novo QR Code.

## 7. Recomendações
- Use senha forte e única; não compartilhe o acesso nem o autenticador.
- Mantenha apenas os admins necessários em `public.admins`.
- Para remover um admin: `delete from public.admins where user_id = '<uuid>';`
