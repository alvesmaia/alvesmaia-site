import { describe, it, expect, vi, beforeEach } from "vitest";
import { turnstileValido } from "../api/src/turnstile";

const cfg = {
  segredo: "segredo-fake",
  acaoEsperada: "contato",
  hostnamesPermitidos: ["alvesmaia.com", "www.alvesmaia.com"],
};

beforeEach(() => vi.restoreAllMocks());

function mockSiteverify(corpo: unknown, status = 200) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(corpo), { status }),
  );
}

const OK = { success: true, action: "contato", hostname: "alvesmaia.com" };

describe("turnstileValido", () => {
  it("aceita um token válido na ação e no hostname esperados", async () => {
    mockSiteverify(OK);
    expect(await turnstileValido("token-bom", "203.0.113.7", cfg)).toBe(true);
  });

  it("aceita qualquer hostname da lista", async () => {
    mockSiteverify({ ...OK, hostname: "www.alvesmaia.com" });
    expect(await turnstileValido("token-bom", null, cfg)).toBe(true);
  });

  it("rejeita quando success é false", async () => {
    mockSiteverify({ ...OK, success: false });
    expect(await turnstileValido("token-bom", null, cfg)).toBe(false);
  });

  it("rejeita um token resolvido em outra ação", async () => {
    // Sem esta checagem, um token de outro formulário do mesmo widget
    // poderia ser reenviado para este endpoint.
    mockSiteverify({ ...OK, action: "newsletter" });
    expect(await turnstileValido("token-bom", null, cfg)).toBe(false);
  });

  it("rejeita um token resolvido em hostname fora da lista", async () => {
    mockSiteverify({ ...OK, hostname: "site-de-terceiro.com" });
    expect(await turnstileValido("token-bom", null, cfg)).toBe(false);
  });

  it("rejeita token vazio sem chamar a API", async () => {
    const spy = mockSiteverify(OK);
    expect(await turnstileValido("", null, cfg)).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it("rejeita token absurdamente longo sem chamar a API", async () => {
    const spy = mockSiteverify(OK);
    expect(await turnstileValido("a".repeat(2049), null, cfg)).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it("rejeita quando a lista de hostnames está vazia", async () => {
    // Configuração incompleta não pode virar "aceita tudo".
    const spy = mockSiteverify(OK);
    expect(
      await turnstileValido("token-bom", null, { ...cfg, hostnamesPermitidos: [] }),
    ).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it("rejeita quando a API responde erro HTTP", async () => {
    mockSiteverify({ success: true }, 500);
    expect(await turnstileValido("token-bom", null, cfg)).toBe(false);
  });

  it("rejeita quando a chamada falha na rede", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("timeout"));
    expect(await turnstileValido("token-bom", null, cfg)).toBe(false);
  });

  it("envia segredo, token e IP de origem", async () => {
    const spy = mockSiteverify(OK);
    await turnstileValido("token-bom", "203.0.113.7", cfg);
    const corpo = (spy.mock.calls[0][1] as RequestInit).body as URLSearchParams;
    expect(corpo.get("secret")).toBe("segredo-fake");
    expect(corpo.get("response")).toBe("token-bom");
    expect(corpo.get("remoteip")).toBe("203.0.113.7");
  });

  it("omite remoteip quando o IP não é conhecido", async () => {
    const spy = mockSiteverify(OK);
    await turnstileValido("token-bom", null, cfg);
    const corpo = (spy.mock.calls[0][1] as RequestInit).body as URLSearchParams;
    expect(corpo.has("remoteip")).toBe(false);
  });
});
