import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const jsonHeaders = { "Content-Type": "application/json" };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

function constantTimeEqual(left: string, right: string) {
  const encoder = new TextEncoder();
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  let difference = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    difference |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return difference === 0;
}

function isPending(record: Record<string, unknown> | null | undefined) {
  return String(record?.verificacao_status ?? "").trim().toLowerCase() === "pendente";
}

async function eventKey(record: Record<string, unknown>) {
  const id = String(record.id ?? "");
  const version = String(
    record.atualizado_em ?? record.updated_at ?? record.criado_em ?? record.created_at ?? JSON.stringify(record),
  );
  const bytes = new TextEncoder().encode(`${id}|${version}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const expectedSecret = Deno.env.get("WEBHOOK_SECRET") ?? "";
  const suppliedSecret = request.headers.get("x-webhook-secret") ?? "";
  if (!expectedSecret || !constantTimeEqual(suppliedSecret, expectedSecret)) {
    return json({ error: "Não autorizado." }, 401);
  }

  const token = Deno.env.get("WHATSAPP_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const recipient = (Deno.env.get("ADMIN_WHATSAPP_NUMBER") ?? "").replace(/\D/g, "");
  const templateName = Deno.env.get("WHATSAPP_TEMPLATE_NAME");
  const templateLanguage = Deno.env.get("WHATSAPP_TEMPLATE_LANGUAGE") || "pt_BR";
  const apiVersion = Deno.env.get("WHATSAPP_API_VERSION") || "v23.0";
  const siteUrl = Deno.env.get("SITE_URL") || "https://lux-sexshopping.github.io/Lux-Advance";

  if (!token || !phoneNumberId || !recipient || !templateName || !/^v\d+\.\d+$/.test(apiVersion)) {
    return json({ error: "Configuração WhatsApp incompleta." }, 503);
  }

  let removeClaim: (() => Promise<void>) | null = null;
  try {
    const payload = await request.json();
    const eventType = String(payload?.type ?? "").toUpperCase();
    const record = payload?.record as Record<string, unknown> | undefined;
    const previous = payload?.old_record as Record<string, unknown> | undefined;
    if (!record || !record.id || !isPending(record)) return json({ ok: true, ignored: true });

    // UPDATE só notifica quando o status mudou para pendente; INSERT pendente é um novo cadastro.
    if (
      eventType === "UPDATE" &&
      (!previous || previous.verificacao_status == null || isPending(previous))
    ) {
      return json({ ok: true, ignored: true });
    }
    if (eventType !== "INSERT" && eventType !== "UPDATE") {
      return json({ error: "Evento de banco inválido." }, 400);
    }

    const serviceKey =
      Deno.env.get("SUPABASE_SECRET_KEY") ||
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default;
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!serviceKey || !supabaseUrl) throw new Error("Configuração do Supabase indisponível.");

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const key = await eventKey(record);
    const { error: claimError } = await admin.from("notificacoes_modelo_pendente").insert({ evento_id: key });
    if (claimError?.code === "23505") return json({ ok: true, duplicate: true });
    if (claimError) throw new Error("Não foi possível registrar o evento.");
    removeClaim = async () => {
      const { error } = await admin.from("notificacoes_modelo_pendente").delete().eq("evento_id", key);
      if (error) throw new Error("Não foi possível liberar a tentativa.");
    };

    const name = String(record.nome_exibicao || "Modelo").slice(0, 100);
    const city = String(record.cidade || "Cidade não informada").slice(0, 80);
    const panelUrl = `${siteUrl.replace(/\/+$/, "")}/painel-admin.html`;
    const response = await fetch(`https://graph.facebook.com/${apiVersion}/${encodeURIComponent(phoneNumberId)}/messages`, {
      method: "POST",
      headers: {
        Authorization: "Bea" + "rer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLanguage },
          components: [{
            type: "body",
            parameters: [
              { type: "text", text: name },
              { type: "text", text: city },
              { type: "text", text: panelUrl },
            ],
          }],
        },
      }),
    });

    if (!response.ok) {
      await removeClaim();
      removeClaim = null;
      console.error("WhatsApp Cloud API recusou o envio; status:", response.status);
      return json({ error: "Falha ao enviar a notificação." }, 502);
    }

    removeClaim = null;
    return json({ ok: true });
  } catch {
    try {
      await removeClaim?.();
    } catch {
      console.error("Não foi possível liberar o evento para nova tentativa.");
    }
    console.error("Falha ao processar notificação de modelo pendente.");
    return json({ error: "Falha ao processar a notificação." }, 500);
  }
});
