import { describe, it, expect, vi, beforeEach } from "vitest";
import { enviarEmail } from "../api/src/graph";

const cfg = {
  tenantId: "tenant-fake",
  clientId: "client-fake",
  clientSecret: "segredo-fake",
};

const dados = {
  nome: "Maria Silva",
  email: "maria@empresa.com.br",
  assunto: "Quero saber mais",
  mensagem: "Gostaria de automatizar a conferência de notas fiscais.",
};

beforeEach(() => vi.restoreAllMocks());

function mockFetch({ tokenOk = true, envioOk = true } = {}) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
    const u = String(url);
    if (u.includes("login.microsoftonline.com")) {
      return tokenOk
        ? new Response(JSON.stringify({ access_token: "token-abc" }), { status: 200 })
        : new Response(JSON.stringify({ error: "invalid_client" }), { status: 401 });
    }
    if (u.includes("graph.microsoft.com")) {
      return new Response("", { status: envioOk ? 202 : 403 });
    }
    throw new Error("URL inesperada: " + u);
  });
}

function chamadaGraph(spy: ReturnType<typeof mockFetch>) {
  return spy.mock.calls.find((c) => String(c[0]).includes("graph.microsoft.com"));
}

function corpoGraph(spy: ReturnType<typeof mockFetch>) {
  return JSON.parse(String((chamadaGraph(spy)![1] as RequestInit).body));
}

describe("enviarEmail", () => {
  it("devolve true quando o Graph aceita", async () => {
    mockFetch();
    expect(await enviarEmail(dados, cfg)).toBe(true);
  });

  it("pede o token com client_credentials e o escopo do Graph", async () => {
    const spy = mockFetch();
    await enviarEmail(dados, cfg);
    const chamada = spy.mock.calls.find((c) => String(c[0]).includes("microsoftonline"));
    const corpo = String((chamada![1] as RequestInit).body);
    expect(corpo).toContain("grant_type=client_credentials");
    expect(corpo).toContain("scope=https%3A%2F%2Fgraph.microsoft.com%2F.default");
  });

  it("envia como no-reply e entrega em contato", async () => {
    const spy = mockFetch();
    await enviarEmail(dados, cfg);
    expect(String(chamadaGraph(spy)![0])).toContain("no-reply%40alvesmaia.com");
    expect(corpoGraph(spy).message.toRecipients[0].emailAddress.address).toBe(
      "contato@alvesmaia.com",
    );
  });

  it("põe o e-mail do visitante em replyTo", async () => {
    const spy = mockFetch();
    await enviarEmail(dados, cfg);
    expect(corpoGraph(spy).message.replyTo[0].emailAddress.address).toBe(
      "maria@empresa.com.br",
    );
  });

  it("não guarda em Itens Enviados", async () => {
    const spy = mockFetch();
    await enviarEmail(dados, cfg);
    expect(corpoGraph(spy).saveToSentItems).toBe(false);
  });

  it("escapa HTML vindo do visitante", async () => {
    const spy = mockFetch();
    await enviarEmail({ ...dados, nome: "<script>alert(1)</script>" }, cfg);
    const html = corpoGraph(spy).message.body.content;
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("devolve false quando o token é recusado", async () => {
    mockFetch({ tokenOk: false });
    expect(await enviarEmail(dados, cfg)).toBe(false);
  });

  it("não chama o Graph quando o token falhou", async () => {
    const spy = mockFetch({ tokenOk: false });
    await enviarEmail(dados, cfg);
    expect(chamadaGraph(spy)).toBeUndefined();
  });

  it("devolve false quando o Graph recusa o envio", async () => {
    mockFetch({ envioOk: false });
    expect(await enviarEmail(dados, cfg)).toBe(false);
  });
});
