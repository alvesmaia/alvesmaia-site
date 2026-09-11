import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from "@azure/functions";
import {
  validarFormulario,
  normalizarContexto,
  type DadosContato,
  type ContextoEmpresa,
} from "../validacao";
import { turnstileValido, type ConfigTurnstile } from "../turnstile";
import { gravarSubmissao, marcarEnviado } from "../armazenamento";
import { enviarEmail, type ConfigGraph } from "../graph";

/**
 * O site virou pagina unica: a ancora de estado vive na raiz, dentro da
 * secao #contato. O CSS revela o aviso por :target.
 */
function redirecionar(ancora: string): HttpResponseInit {
  return { status: 303, headers: { Location: `/#${ancora}` } };
}

/** Deve casar com o data-action do widget em contato.html. */
const ACAO_TURNSTILE = "contato";

/**
 * Teto do corpo, conferido antes de `formData()` — que le tudo em memoria.
 * O formulario maior possivel cabe com folga em 64 KB; qualquer coisa acima
 * disso e sondagem, e sem este corte um POST de 50 MB gasta memoria e uma
 * execucao do plano Free sem nunca chegar na verificacao do Turnstile.
 */
const TETO_CORPO_BYTES = 64 * 1024;

/**
 * O x-forwarded-for do App Service chega como `ip:porta`, e atras de proxies
 * encadeados como lista. O cliente original e o primeiro item. Sem este
 * tratamento o remoteip enviado ao siteverify e malformado — a reputacao por
 * IP da Cloudflare nunca entra em jogo — e a coluna `ip` da tabela, unico
 * rastro forense de abuso, guarda lixo.
 *
 * O header continua sendo controlado pelo cliente: serve como indicio, nunca
 * como identidade.
 */
function ipDoCliente(bruto: string | null): string {
  const primeiro = (bruto ?? "").split(",")[0].trim();
  if (!primeiro) return "";
  // IPv6 entre colchetes: [::1]:443. IPv4 com porta: 10.0.0.1:443.
  const comColchetes = primeiro.match(/^\[(.+)\](?::\d+)?$/);
  if (comColchetes) return comColchetes[1];
  const partes = primeiro.split(":");
  // Mais de um ":" e IPv6 sem porta; exatamente um e IPv4 com porta.
  return partes.length === 2 ? partes[0] : primeiro;
}

interface Config {
  graph: ConfigGraph;
  turnstile: ConfigTurnstile;
  conexaoTabelas: string;
}

/**
 * Falta de configuração é erro de operação, não do visitante. Detectar antes
 * de gravar evita uma linha órfã que nunca teria como ser enviada.
 */
function lerConfig(): Config | null {
  const {
    GRAPH_TENANT_ID,
    GRAPH_CLIENT_ID,
    GRAPH_CLIENT_SECRET,
    TURNSTILE_SECRET_KEY,
    TURNSTILE_HOSTNAMES,
    TABLES_CONNECTION_STRING,
  } = process.env;

  if (
    !GRAPH_TENANT_ID ||
    !GRAPH_CLIENT_ID ||
    !GRAPH_CLIENT_SECRET ||
    !TURNSTILE_SECRET_KEY ||
    !TURNSTILE_HOSTNAMES ||
    !TABLES_CONNECTION_STRING
  ) {
    return null;
  }

  // " " e ",," sao strings verdadeiras que nao rendem hostname nenhum. Sem
  // esta checagem a config passa, a lista sai vazia e TODO visitante leva
  // "marque a caixa antes de enviar" — com o unico sinal num log que ninguem
  // le. Configuracao quebrada deve parecer configuracao quebrada.
  const hostnamesPermitidos = TURNSTILE_HOSTNAMES.split(",")
    .map((h) => h.trim())
    .filter(Boolean);
  if (hostnamesPermitidos.length === 0) return null;

  return {
    graph: {
      tenantId: GRAPH_TENANT_ID,
      clientId: GRAPH_CLIENT_ID,
      clientSecret: GRAPH_CLIENT_SECRET,
    },
    turnstile: {
      segredo: TURNSTILE_SECRET_KEY,
      acaoEsperada: ACAO_TURNSTILE,
      hostnamesPermitidos,
    },
    conexaoTabelas: TABLES_CONNECTION_STRING,
  };
}

export async function contato(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const config = lerConfig();
  if (!config) {
    context.error("Application Settings incompletas — o formulario nao pode operar");
    return redirecionar("erro");
  }

  const declarado = Number(request.headers.get("content-length") ?? "0");
  if (declarado > TETO_CORPO_BYTES) {
    context.error("Corpo acima do teto:", declarado);
    return redirecionar("erro");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch (e) {
    context.error("Corpo do formulario ilegivel:", e);
    return redirecionar("erro");
  }

  const dados: DadosContato = {
    nome: String(form.get("nome") ?? ""),
    email: String(form.get("email") ?? ""),
    mensagem: String(form.get("mensagem") ?? ""),
  };

  // Contexto opcional: em branco não impede o envio, só empobrece o e-mail.
  const contexto: ContextoEmpresa = normalizarContexto({
    empresa: String(form.get("empresa") ?? ""),
    segmento: String(form.get("segmento") ?? ""),
    funcionarios: String(form.get("funcionarios") ?? ""),
  });

  const erros = validarFormulario(dados);
  if (erros.length > 0) {
    context.error("Formulario invalido:", erros.join(", "));
    return redirecionar("erro");
  }

  const ip = ipDoCliente(request.headers.get("x-forwarded-for"));
  const token = String(form.get("cf-turnstile-response") ?? "");
  if (!(await turnstileValido(token, ip || null, config.turnstile))) {
    return redirecionar("robo");
  }

  // Grava antes de enviar: se o Graph falhar, o lead continua recuperavel.
  const rowKey = await gravarSubmissao({ ...dados, ...contexto, ip }, config.conexaoTabelas);
  if (!rowKey) return redirecionar("erro");

  const enviado = await enviarEmail(dados, contexto, config.graph);
  if (!enviado) return redirecionar("erro");

  await marcarEnviado(rowKey, config.conexaoTabelas);
  return redirecionar("enviado");
}

app.http("contato", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "contato",
  handler: contato,
});
