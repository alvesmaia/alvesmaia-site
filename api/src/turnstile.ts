const VERIFICAR = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Acima disto não é um token do Turnstile — é alguém sondando o endpoint. */
const TAMANHO_MAXIMO_TOKEN = 2048;
const TEMPO_LIMITE_MS = 10_000;

export interface ConfigTurnstile {
  segredo: string;
  /** Deve casar com o data-action do widget no HTML. */
  acaoEsperada: string;
  /** Nunca inclua localhost aqui em produção. */
  hostnamesPermitidos: string[];
}

interface RespostaSiteverify {
  success?: boolean;
  action?: string;
  hostname?: string;
}

/**
 * Verificação canônica: `success` sozinho não basta.
 *
 * Sem conferir `action` e `hostname`, um token resolvido em qualquer outra
 * página de qualquer hostname registrado no mesmo widget pode ser reenviado
 * a este endpoint. As três checagens juntas amarram o token a este
 * formulário, neste site.
 *
 * Falha fechada: qualquer erro de rede, HTTP ou parsing devolve false.
 */
export async function turnstileValido(
  token: string,
  ip: string | null,
  cfg: ConfigTurnstile,
): Promise<boolean> {
  if (typeof token !== "string" || token.length === 0) return false;
  if (token.length > TAMANHO_MAXIMO_TOKEN) return false;
  // Lista vazia significa configuração incompleta, não "aceita qualquer um".
  if (cfg.hostnamesPermitidos.length === 0) {
    console.error("TURNSTILE_HOSTNAMES vazio — verificacao rejeitada por seguranca");
    return false;
  }

  const corpo = new URLSearchParams({ secret: cfg.segredo, response: token });
  if (ip) corpo.append("remoteip", ip);

  let resposta: RespostaSiteverify;
  try {
    const r = await fetch(VERIFICAR, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
      body: corpo,
    });
    if (!r.ok) {
      console.error("Siteverify respondeu erro:", r.status);
      return false;
    }
    resposta = (await r.json()) as RespostaSiteverify;
  } catch (e) {
    console.error("Falha ao verificar o Turnstile:", e);
    return false;
  }

  if (resposta.success !== true) return false;
  if (resposta.action !== cfg.acaoEsperada) {
    console.error("Turnstile: acao inesperada:", resposta.action);
    return false;
  }
  if (!cfg.hostnamesPermitidos.includes(resposta.hostname ?? "")) {
    console.error("Turnstile: hostname fora da lista:", resposta.hostname);
    return false;
  }
  return true;
}
