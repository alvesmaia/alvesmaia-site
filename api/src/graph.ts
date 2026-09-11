import type { DadosContato, ContextoEmpresa } from "./validacao";

const REMETENTE = "no-reply@alvesmaia.com";

/**
 * Sem isto o fetch herda o headersTimeout do undici — 300s. O host do
 * Functions mata a invocacao antes, o visitante recebe um 5xx cru em vez do
 * redirect, e o catch que escreveria o log nunca roda: a falha some.
 */
const TEMPO_LIMITE_MS = 10_000;
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
        signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
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

/** Linhas do contexto opcional: só entram as que o visitante preencheu. */
function linhasContexto(c: ContextoEmpresa): string {
  const campos: Array<[string, string]> = [
    ["Empresa", c.empresa],
    ["Segmento", c.segmento],
    ["Funcionários", c.funcionarios],
  ];
  return campos
    .filter(([, valor]) => valor !== "")
    .map(([nome, valor]) => `<p><strong>${nome}:</strong> ${escapar(valor)}</p>`)
    .join("");
}

/**
 * O formulário não pede mais assunto. O que identifica a mensagem na caixa
 * de entrada passa a ser quem escreveu e, quando informada, a empresa.
 */
function assuntoDoEmail(d: DadosContato, c: ContextoEmpresa): string {
  const nome = d.nome.trim();
  return c.empresa ? `[Site] ${nome} — ${c.empresa}` : `[Site] ${nome}`;
}

function montarHtml(d: DadosContato, c: ContextoEmpresa): string {
  return (
    `<p><strong>Nome:</strong> ${escapar(d.nome.trim())}</p>` +
    `<p><strong>E-mail:</strong> ${escapar(d.email.trim())}</p>` +
    linhasContexto(c) +
    `<hr>` +
    `<p>${escapar(d.mensagem.trim()).replace(/\n/g, "<br>")}</p>`
  );
}

export async function enviarEmail(
  d: DadosContato,
  c: ContextoEmpresa,
  cfg: ConfigGraph,
): Promise<boolean> {
  const token = await obterToken(cfg);
  if (!token) return false;

  const mensagem = {
    message: {
      subject: assuntoDoEmail(d, c),
      body: { contentType: "HTML", content: montarHtml(d, c) },
      // no-reply@ e contato@ sao aliases da mesma caixa. Sem declarar o
      // `from`, o Exchange carimba o endereco PRIMARIO dela — e a mensagem
      // do formulario chegaria aparentando vir da caixa pessoal, nao do
      // remetente automatico. Exige SendFromAliasEnabled ligado no tenant,
      // o que ja e o caso.
      from: { emailAddress: { address: REMETENTE } },
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
        signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
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
