import { validarFormulario, type DadosContato } from "../../src/validacao";

interface Env {
  RESEND_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
}

const DESTINO = "contato@alvesmaia.com";
// Subdominio de envio: mantem MX, SPF, DKIM e DMARC da raiz intocados.
const REMETENTE = "Site Alvesmaia <formulario@mail.alvesmaia.com>";

function redirecionar(ancora: string): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: `/contato.html#${ancora}` },
  });
}

async function turnstileValido(
  token: string,
  segredo: string,
  ip: string | null,
): Promise<boolean> {
  if (!token) return false;

  const corpo = new FormData();
  corpo.append("secret", segredo);
  corpo.append("response", token);
  if (ip) corpo.append("remoteip", ip);

  try {
    const r = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: corpo },
    );
    const json = (await r.json()) as { success?: boolean };
    return json.success === true;
  } catch (e) {
    console.error("Falha ao verificar o Turnstile:", e);
    return false;
  }
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function enviarEmail(d: DadosContato, chave: string): Promise<boolean> {
  const corpo = {
    from: REMETENTE,
    to: [DESTINO],
    // Responder no Outlook vai direto para o visitante.
    reply_to: d.email.trim(),
    subject: `[Site] ${d.assunto} — ${d.nome.trim()}`,
    html:
      `<p><strong>Nome:</strong> ${escapar(d.nome.trim())}</p>` +
      `<p><strong>E-mail:</strong> ${escapar(d.email.trim())}</p>` +
      `<p><strong>Assunto:</strong> ${escapar(d.assunto)}</p>` +
      `<hr>` +
      `<p>${escapar(d.mensagem.trim()).replace(/\n/g, "<br>")}</p>`,
  };

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(corpo),
    });
    if (!r.ok) {
      // Visivel no log da Cloudflare — sem isto, uma chave expirada some
      // em silencio e cada lead perdido fica sem rastro.
      console.error("Resend recusou o envio:", r.status, await r.text());
    }
    return r.ok;
  } catch (e) {
    console.error("Falha de rede ao chamar a Resend:", e);
    return false;
  }
}

export const onRequestPost = async (contexto: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  const { request, env } = contexto;

  let form: FormData;
  try {
    form = await request.formData();
  } catch (e) {
    console.error("Corpo do formulario ilegivel:", e);
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
    console.error("Formulario invalido:", erros.join(", "));
    return redirecionar("erro");
  }

  const token = String(form.get("cf-turnstile-response") ?? "");
  const ip = request.headers.get("CF-Connecting-IP");
  if (!(await turnstileValido(token, env.TURNSTILE_SECRET_KEY, ip))) {
    return redirecionar("robo");
  }

  const enviado = await enviarEmail(dados, env.RESEND_API_KEY);
  return redirecionar(enviado ? "enviado" : "erro");
};
