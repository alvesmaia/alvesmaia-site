import { describe, it, expect, vi, beforeEach } from "vitest";
import { onRequestPost } from "../functions/api/contato";

const env = { RESEND_API_KEY: "chave-fake", TURNSTILE_SECRET_KEY: "segredo-fake" };

function requisicao(campos: Record<string, string>) {
  const form = new FormData();
  for (const [k, v] of Object.entries(campos)) form.append(k, v);
  return new Request("https://alvesmaia.com/api/contato", { method: "POST", body: form });
}

const camposValidos = {
  nome: "Maria Silva",
  email: "maria@empresa.com.br",
  assunto: "Orçamento",
  mensagem: "Gostaria de automatizar a conferência de notas fiscais.",
  "cf-turnstile-response": "token-valido",
};

beforeEach(() => {
  vi.restoreAllMocks();
});

function mockFetch(turnstileOk: boolean, resendOk = true) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
    const u = String(url);
    if (u.includes("siteverify")) {
      return new Response(JSON.stringify({ success: turnstileOk }), { status: 200 });
    }
    if (u.includes("resend.com")) {
      return new Response("{}", { status: resendOk ? 200 : 500 });
    }
    throw new Error("URL inesperada: " + u);
  });
}

describe("onRequestPost", () => {
  it("redireciona para #enviado quando tudo está correto", async () => {
    mockFetch(true);
    const res = await onRequestPost({ request: requisicao(camposValidos), env } as never);
    expect(res.status).toBe(303);
    expect(res.headers.get("Location")).toBe("/contato.html#enviado");
  });

  it("redireciona para #erro quando a validação falha", async () => {
    mockFetch(true);
    const res = await onRequestPost({
      request: requisicao({ ...camposValidos, email: "invalido" }),
      env,
    } as never);
    expect(res.headers.get("Location")).toBe("/contato.html#erro");
  });

  it("não chama a Resend quando a validação falha", async () => {
    const spy = mockFetch(true);
    await onRequestPost({ request: requisicao({ ...camposValidos, nome: "" }), env } as never);
    const chamadasResend = spy.mock.calls.filter((c) => String(c[0]).includes("resend.com"));
    expect(chamadasResend).toHaveLength(0);
  });

  it("redireciona para #robo quando o Turnstile reprova", async () => {
    mockFetch(false);
    const res = await onRequestPost({ request: requisicao(camposValidos), env } as never);
    expect(res.headers.get("Location")).toBe("/contato.html#robo");
  });

  it("não chama a Resend quando o Turnstile reprova", async () => {
    const spy = mockFetch(false);
    await onRequestPost({ request: requisicao(camposValidos), env } as never);
    const chamadasResend = spy.mock.calls.filter((c) => String(c[0]).includes("resend.com"));
    expect(chamadasResend).toHaveLength(0);
  });

  it("redireciona para #robo quando o token do Turnstile está ausente", async () => {
    const spy = mockFetch(true);
    const { "cf-turnstile-response": _, ...semToken } = camposValidos;
    const res = await onRequestPost({ request: requisicao(semToken), env } as never);
    expect(res.headers.get("Location")).toBe("/contato.html#robo");
    // Sem token não vale nem gastar a chamada de verificação
    expect(spy.mock.calls.filter((c) => String(c[0]).includes("siteverify"))).toHaveLength(0);
  });

  it("redireciona para #erro quando a Resend falha", async () => {
    mockFetch(true, false);
    const res = await onRequestPost({ request: requisicao(camposValidos), env } as never);
    expect(res.headers.get("Location")).toBe("/contato.html#erro");
  });

  it("envia o e-mail do visitante como reply_to", async () => {
    const spy = mockFetch(true);
    await onRequestPost({ request: requisicao(camposValidos), env } as never);
    const chamada = spy.mock.calls.find((c) => String(c[0]).includes("resend.com"));
    const corpo = JSON.parse(String((chamada![1] as RequestInit).body));
    expect(corpo.reply_to).toBe("maria@empresa.com.br");
    expect(corpo.to).toContain("contato@alvesmaia.com");
    expect(corpo.from).toContain("mail.alvesmaia.com");
  });

  it("escapa HTML vindo do visitante", async () => {
    const spy = mockFetch(true);
    await onRequestPost({
      request: requisicao({ ...camposValidos, nome: "<script>alert(1)</script>" }),
      env,
    } as never);
    const chamada = spy.mock.calls.find((c) => String(c[0]).includes("resend.com"));
    const corpo = JSON.parse(String((chamada![1] as RequestInit).body));
    expect(corpo.html).not.toContain("<script>");
    expect(corpo.html).toContain("&lt;script&gt;");
  });
});
