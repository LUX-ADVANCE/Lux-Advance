# Notificações de modelos pendentes pelo WhatsApp

A função `notificar-modelo-pendente` usa a WhatsApp Cloud API da Meta. Ela recebe os eventos do Database Webhook do Supabase e só envia mensagem quando `modelo_perfis.verificacao_status` entra em `pendente` (em INSERT ou na transição de UPDATE). A mensagem contém apenas nome, cidade e link do painel; não inclui documentos, CPF, endereço ou telefone da modelo.

## 1. Preparar o app da Meta

1. Crie um app em [Meta for Developers](https://developers.facebook.com/) e adicione o produto **WhatsApp**.
2. Configure uma conta e um número de WhatsApp Business e obtenha o **Phone Number ID**.
3. Gere um token de acesso com permissão `whatsapp_business_messaging`. Para produção, use um token de sistema permanente e restrinja seus ativos.
4. Crie e envie para aprovação um modelo de mensagem em português (`pt_BR`), por exemplo:

   **Nome:** `lux_modelo_pendente`

   **Categoria:** Utility
   **Corpo:** `🔔 LUX: nova modelo pendente de aprovação — {{1}}, {{2}}. Acesse o painel: {{3}}`

   A função envia três parâmetros nessa ordem: nome da modelo, cidade e URL do painel. Configure o destinatário `ADMIN_WHATSAPP_NUMBER` no formato internacional (apenas números, por exemplo `55DDDNUMERO`).

## 2. Configurar os secrets e publicar

Na raiz do projeto, usando o Supabase CLI vinculado ao projeto correto:

```sh
supabase secrets set \
  WHATSAPP_TOKEN="TOKEN_DA_META" \
  WHATSAPP_PHONE_NUMBER_ID="ID_DO_NUMERO" \
  ADMIN_WHATSAPP_NUMBER="55DDDNUMERO" \
  WHATSAPP_TEMPLATE_NAME="lux_modelo_pendente" \
  WHATSAPP_TEMPLATE_LANGUAGE="pt_BR" \
  WHATSAPP_API_VERSION="v23.0" \
  WEBHOOK_SECRET="SEGREDO_LONGO_ALEATORIO" \
  SITE_URL="https://lux-sexshopping.github.io/Lux-Advance" \

supabase functions deploy notificar-modelo-pendente --no-verify-jwt
```

Use o segredo privado somente no ambiente Supabase; nunca o coloque no HTML, JavaScript do site ou Git. `WHATSAPP_API_VERSION` deve corresponder a uma versão Graph API ainda suportada pela Meta. Não use o número de teste da Meta para notificações de produção.
O Supabase disponibiliza `SUPABASE_SERVICE_ROLE_KEY` automaticamente para Edge Functions; não é necessário copiá-la para o comando. Se o projeto usa um nome de chave customizado, cadastre-a como `SUPABASE_SECRET_KEY`.

## 3. Aplicar a migração de contato

Confirme que as tabelas e políticas do schema existente já foram aplicadas. Antes de publicar a vitrine, revise e execute `supabase/vitrine-contato.sql` no SQL Editor do Supabase. A migração restringe a leitura anônima às colunas públicas e cria `public.obter_contato_modelo(uuid)`, que só pode ser executada por contas autenticadas. Ela também cria a tabela privada usada para idempotência das notificações.

## 4. Configurar o Database Webhook

1. No painel Supabase, abra **Database → Webhooks → Create a new webhook**.
2. Selecione a tabela `public.modelo_perfis`, método `POST` e os eventos **INSERT** e **UPDATE**.
3. Use a URL `https://SEU-PROJETO.supabase.co/functions/v1/notificar-modelo-pendente`.
4. Adicione o header `x-webhook-secret` com o mesmo valor de `WEBHOOK_SECRET` salvo nos secrets.
5. A migração de contato configura `REPLICA IDENTITY FULL` para que `old_record` contenha o status anterior e a função detecte transições com precisão. O conteúdo permanece entre Supabase e a Edge Function e não é registrado nos logs.
6. Salve. A função rejeita com `401` chamadas sem o segredo correto.

## 5. Testar

Faça um cadastro de modelo de teste e confirme que o INSERT cria uma notificação. Depois, altere uma modelo de `em_analise` para `pendente`; deve chegar uma mensagem. Alterar outros campos enquanto o status continua pendente não deve enviar novamente. Reenvios do mesmo evento são deduplicados.

Verifique **Edge Functions → Logs** e o histórico de execução do Database Webhook. Os logs da função não registram telefone, token, conteúdo do payload ou resposta privada da Meta. Se a Meta retornar falha, confira o status nos logs, o estado de aprovação do template e os secrets; a função retorna erro para permitir nova tentativa do webhook.

## Provedor alternativo

Meta Cloud API é o provedor implementado. Twilio ou CallMeBot podem substituir o envio HTTP mantendo a mesma validação do webhook, a lógica de transição e os secrets no servidor. Revise limites, política de mensagens e requisitos de template do provedor antes de ativar.
