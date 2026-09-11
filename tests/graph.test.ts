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
  mensagem: "Gostaria de automatizar a conferência de notas fiscais.",
};

const contexto = { empresa: "Acme Ltda", segmento: "Indústria", funcionarios: "11 a 50" };
const semContexto = { empresa: "", segmento: "", funcionarios: "" };

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
    expect(await enviarEmail(dados, contexto, cfg)).toBe(true);
  });

  it("pede o token com client_credentials e o escopo do Graph", async () => {
    const spy = mockFetch();
    await enviarEmail(dados, contexto, cfg);
    const chamada = spy.mock.calls.find((c) => String(c[0]).includes("microsoftonline"));
    const corpo = String((chamada![1] as RequestInit).body);
    expect(corpo).toContain("grant_type=client_credentials");
    expect(corpo).toContain("scope=https%3A%2F%2Fgraph.microsoft.com%2F.default");
  });

  it("envia como no-reply e entrega em contato", async () => {
    const spy = mockFetch();
    await enviarEmail(dados, contexto, cfg);
    expect(String(chamadaGraph(spy)![0])).toContain("no-reply%40alvesmaia.com");
    expect(corpoGraph(spy).message.toRecipients[0].emailAddress.address).toBe(
      "contato@alvesmaia.com",
    );
  });

  it("declara o remetente explicitamente, e não deixa o Exchange escolher", async () => {
    // no-reply@ e contato@ sao aliases da mesma caixa. Sem o campo `from`,
    // o Exchange carimba o endereco primario dela e a mensagem chega
    // aparentando vir da caixa pessoal.
    const spy = mockFetch();
    await enviarEmail(dados, contexto, cfg);
    expect(corpoGraph(spy).message.from.emailAddress.address).toBe("no-reply@alvesmaia.com");
  });

  it("assina com o nome da empresa, não com o da caixa", async () => {
    // no-reply@ e alias de uma caixa pessoal. Sem nome explicito o Exchange
    // usa o da caixa, e a mensagem chega assinada com o nome da pessoa.
    const spy = mockFetch();
    await enviarEmail(dados, contexto, cfg);
    expect(corpoGraph(spy).message.from.emailAddress.name).toBe("Alvesmaia");
  });

  it("leva o nome do visitante no replyTo", async () => {
    const spy = mockFetch();
    await enviarEmail(dados, contexto, cfg);
    const rt = corpoGraph(spy).message.replyTo[0].emailAddress;
    expect(rt.name).toBe(dados.nome.trim());
    expect(rt.address).toBe(dados.email.trim());
  });

  it("põe o e-mail do visitante em replyTo", async () => {
    const spy = mockFetch();
    await enviarEmail(dados, contexto, cfg);
    expect(corpoGraph(spy).message.replyTo[0].emailAddress.address).toBe(
      "maria@empresa.com.br",
    );
  });

  it("não guarda em Itens Enviados", async () => {
    const spy = mockFetch();
    await enviarEmail(dados, contexto, cfg);
    expect(corpoGraph(spy).saveToSentItems).toBe(false);
  });

  it("escapa HTML vindo do visitante", async () => {
    const spy = mockFetch();
    await enviarEmail({ ...dados, nome: "<script>alert(1)</script>" }, contexto, cfg);
    const html = corpoGraph(spy).message.body.content;
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("o assunto traz nome e empresa quando ela foi informada", async () => {
    const spy = mockFetch();
    await enviarEmail(dados, contexto, cfg);
    expect(corpoGraph(spy).message.subject).toBe("[Site] Maria Silva - Acme Ltda");
  });

  it("o assunto traz só o nome quando não há empresa", async () => {
    const spy = mockFetch();
    await enviarEmail(dados, semContexto, cfg);
    expect(corpoGraph(spy).message.subject).toBe("[Site] Maria Silva");
  });

  it("inclui o contexto da empresa quando preenchido", async () => {
    const spy = mockFetch();
    await enviarEmail(dados, contexto, cfg);
    const html = corpoGraph(spy).message.body.content;
    expect(html).toContain("Acme Ltda");
    expect(html).toContain("Indústria");
    expect(html).toContain("11 a 50");
  });

  it("omite as linhas de contexto em branco", async () => {
    const spy = mockFetch();
    await enviarEmail(dados, semContexto, cfg);
    const html = corpoGraph(spy).message.body.content;
    expect(html).not.toContain("Empresa:");
    expect(html).not.toContain("Segmento:");
    expect(html).not.toContain("Funcionários:");
  });

  it("escapa HTML vindo do contexto", async () => {
    const spy = mockFetch();
    await enviarEmail(dados, { ...contexto, empresa: "<b>x</b>" }, cfg);
    const html = corpoGraph(spy).message.body.content;
    expect(html).toContain("&lt;b&gt;x&lt;/b&gt;");
  });

  it("devolve false quando o token é recusado", async () => {
    mockFetch({ tokenOk: false });
    expect(await enviarEmail(dados, contexto, cfg)).toBe(false);
  });

  it("não chama o Graph quando o token falhou", async () => {
    const spy = mockFetch({ tokenOk: false });
    await enviarEmail(dados, contexto, cfg);
    expect(chamadaGraph(spy)).toBeUndefined();
  });

  it("devolve false quando o Graph recusa o envio", async () => {
    mockFetch({ envioOk: false });
    expect(await enviarEmail(dados, contexto, cfg)).toBe(false);
  });
});
