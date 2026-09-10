import { describe, it, expect, vi, beforeEach } from "vitest";

const turnstileValido = vi.fn();
const gravarSubmissao = vi.fn();
const marcarEnviado = vi.fn();
const enviarEmail = vi.fn();

vi.mock("../api/src/turnstile", () => ({ turnstileValido }));
vi.mock("../api/src/armazenamento", () => ({ gravarSubmissao, marcarEnviado }));
vi.mock("../api/src/graph", () => ({ enviarEmail }));
// app.http() roda na importação do módulo; sem este mock o registro real
// tenta se conectar ao runtime do Functions e o import falha.
vi.mock("@azure/functions", () => ({ app: { http: vi.fn() } }));

const { contato } = await import("../api/src/functions/contato");

const camposValidos = {
  nome: "Maria Silva",
  email: "maria@empresa.com.br",
  assunto: "Orçamento",
  mensagem: "Gostaria de automatizar a conferência de notas fiscais.",
  "cf-turnstile-response": "token-valido",
};

const ROW_KEY = "2026-09-10T12:00:00.000Z-abc";

function requisicao(campos: Record<string, string>) {
  const form = new FormData();
  for (const [k, v] of Object.entries(campos)) form.append(k, v);
  return {
    formData: async () => form,
    headers: new Headers({ "x-forwarded-for": "203.0.113.7" }),
  };
}

const contexto = { error: vi.fn(), log: vi.fn() };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.GRAPH_TENANT_ID = "tenant";
  process.env.GRAPH_CLIENT_ID = "client";
  process.env.GRAPH_CLIENT_SECRET = "segredo";
  process.env.TURNSTILE_SECRET_KEY = "turnstile";
  process.env.TURNSTILE_HOSTNAMES = "alvesmaia.com,www.alvesmaia.com";
  process.env.TABLES_CONNECTION_STRING = "conexao";
  turnstileValido.mockResolvedValue(true);
  gravarSubmissao.mockResolvedValue(ROW_KEY);
  enviarEmail.mockResolvedValue(true);
  marcarEnviado.mockResolvedValue(undefined);
});

async function chamar(campos = camposValidos) {
  return contato(requisicao(campos) as never, contexto as never);
}

describe("contato", () => {
  it("redireciona para #enviado no caminho feliz", async () => {
    const res = await chamar();
    expect(res.status).toBe(303);
    expect((res.headers as Record<string, string>).Location).toBe(
      "/contato.html#enviado",
    );
  });

  it("redireciona para #erro quando a validação falha", async () => {
    const res = await chamar({ ...camposValidos, email: "invalido" });
    expect((res.headers as Record<string, string>).Location).toBe("/contato.html#erro");
  });

  it("não grava nem envia quando a validação falha", async () => {
    await chamar({ ...camposValidos, nome: "" });
    expect(gravarSubmissao).not.toHaveBeenCalled();
    expect(enviarEmail).not.toHaveBeenCalled();
  });

  it("redireciona para #robo quando o Turnstile reprova", async () => {
    turnstileValido.mockResolvedValue(false);
    const res = await chamar();
    expect((res.headers as Record<string, string>).Location).toBe("/contato.html#robo");
  });

  it("não grava quando o Turnstile reprova", async () => {
    turnstileValido.mockResolvedValue(false);
    await chamar();
    expect(gravarSubmissao).not.toHaveBeenCalled();
  });

  it("grava antes de enviar", async () => {
    await chamar();
    expect(gravarSubmissao.mock.invocationCallOrder[0]).toBeLessThan(
      enviarEmail.mock.invocationCallOrder[0],
    );
  });

  it("passa o IP de origem para a gravação", async () => {
    await chamar();
    expect(gravarSubmissao.mock.calls[0][0].ip).toBe("203.0.113.7");
  });

  it("não tenta enviar quando a gravação falha", async () => {
    gravarSubmissao.mockResolvedValue(null);
    const res = await chamar();
    expect(enviarEmail).not.toHaveBeenCalled();
    expect((res.headers as Record<string, string>).Location).toBe("/contato.html#erro");
  });

  it("marca como enviado quando o Graph aceita", async () => {
    await chamar();
    expect(marcarEnviado).toHaveBeenCalledWith(ROW_KEY, "conexao");
  });

  it("redireciona para #erro e não marca quando o Graph recusa", async () => {
    enviarEmail.mockResolvedValue(false);
    const res = await chamar();
    expect(marcarEnviado).not.toHaveBeenCalled();
    expect((res.headers as Record<string, string>).Location).toBe("/contato.html#erro");
  });

  it("redireciona para #erro quando falta configuração", async () => {
    delete process.env.GRAPH_CLIENT_SECRET;
    const res = await chamar();
    expect((res.headers as Record<string, string>).Location).toBe("/contato.html#erro");
    expect(gravarSubmissao).not.toHaveBeenCalled();
  });

  it("redireciona para #erro quando falta a lista de hostnames", async () => {
    delete process.env.TURNSTILE_HOSTNAMES;
    const res = await chamar();
    expect((res.headers as Record<string, string>).Location).toBe("/contato.html#erro");
    expect(turnstileValido).not.toHaveBeenCalled();
  });

  it("passa a ação e os hostnames esperados para a verificação", async () => {
    await chamar();
    const cfg = turnstileValido.mock.calls[0][2];
    expect(cfg.acaoEsperada).toBe("contato");
    expect(cfg.hostnamesPermitidos).toEqual(["alvesmaia.com", "www.alvesmaia.com"]);
  });
});
