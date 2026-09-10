import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from "@azure/functions";
import { validarFormulario, type DadosContato } from "../validacao";
import { turnstileValido } from "../turnstile";
import { gravarSubmissao, marcarEnviado } from "../armazenamento";
import { enviarEmail, type ConfigGraph } from "../graph";

function redirecionar(ancora: string): HttpResponseInit {
  return { status: 303, headers: { Location: `/contato.html#${ancora}` } };
}

interface Config {
  graph: ConfigGraph;
  turnstileSecret: string;
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
    TABLES_CONNECTION_STRING,
  } = process.env;

  if (
    !GRAPH_TENANT_ID ||
    !GRAPH_CLIENT_ID ||
    !GRAPH_CLIENT_SECRET ||
    !TURNSTILE_SECRET_KEY ||
    !TABLES_CONNECTION_STRING
  ) {
    return null;
  }

  return {
    graph: {
      tenantId: GRAPH_TENANT_ID,
      clientId: GRAPH_CLIENT_ID,
      clientSecret: GRAPH_CLIENT_SECRET,
    },
    turnstileSecret: TURNSTILE_SECRET_KEY,
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
    assunto: String(form.get("assunto") ?? ""),
    mensagem: String(form.get("mensagem") ?? ""),
  };

  const erros = validarFormulario(dados);
  if (erros.length > 0) {
    context.error("Formulario invalido:", erros.join(", "));
    return redirecionar("erro");
  }

  const ip = request.headers.get("x-forwarded-for") ?? "";
  const token = String(form.get("cf-turnstile-response") ?? "");
  if (!(await turnstileValido(token, config.turnstileSecret, ip || null))) {
    return redirecionar("robo");
  }

  // Grava antes de enviar: se o Graph falhar, o lead continua recuperavel.
  const rowKey = await gravarSubmissao({ ...dados, ip }, config.conexaoTabelas);
  if (!rowKey) return redirecionar("erro");

  const enviado = await enviarEmail(dados, config.graph);
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
