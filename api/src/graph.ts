import type { DadosContato } from "./validacao";

const REMETENTE = "no-reply@alvesmaia.com";
const DESTINO = "contato@alvesmaia.com";

export interface ConfigGraph {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

async function obterToken(cfg: ConfigGraph): Promise<string | null> {
  const corpo = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  try {
    const r = await fetch(
      `https://login.microsoftonline.com/${cfg.tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: corpo.toString(),
      },
    );
    if (!r.ok) {
      // Quase sempre client secret expirado. Sem este log, some em silencio.
      console.error("Entra recusou o token:", r.status, await r.text());
      return null;
    }
    const json = (await r.json()) as { access_token?: string };
    return json.access_token ?? null;
  } catch (e) {
    console.error("Falha de rede ao obter o token do Entra:", e);
    return null;
  }
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function montarHtml(d: DadosContato): string {
  return (
    `<p><strong>Nome:</strong> ${escapar(d.nome.trim())}</p>` +
    `<p><strong>E-mail:</strong> ${escapar(d.email.trim())}</p>` +
    `<p><strong>Assunto:</strong> ${escapar(d.assunto)}</p>` +
    `<hr>` +
    `<p>${escapar(d.mensagem.trim()).replace(/\n/g, "<br>")}</p>`
  );
}

export async function enviarEmail(d: DadosContato, cfg: ConfigGraph): Promise<boolean> {
  const token = await obterToken(cfg);
  if (!token) return false;

  const mensagem = {
    message: {
      subject: `[Site] ${d.assunto} — ${d.nome.trim()}`,
      body: { contentType: "HTML", content: montarHtml(d) },
      toRecipients: [{ emailAddress: { address: DESTINO } }],
      // Responder no Outlook vai direto para o visitante.
      replyTo: [{ emailAddress: { address: d.email.trim() } }],
    },
    saveToSentItems: false,
  };

  try {
    const r = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(REMETENTE)}/sendMail`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mensagem),
      },
    );
    if (!r.ok) {
      // 403 aqui costuma ser a Application Access Policy barrando a caixa.
      console.error("Graph recusou o envio:", r.status, await r.text());
    }
    return r.ok;
  } catch (e) {
    console.error("Falha de rede ao chamar o Graph:", e);
    return false;
  }
}
