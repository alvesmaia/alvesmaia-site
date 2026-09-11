import { describe, it, expect, vi, beforeEach } from "vitest";

const criarEntidade = vi.fn();
const atualizarEntidade = vi.fn();
const criarTabela = vi.fn();

vi.mock("@azure/data-tables", () => ({
  TableClient: {
    fromConnectionString: () => ({
      createTable: criarTabela,
      createEntity: criarEntidade,
      updateEntity: atualizarEntidade,
    }),
  },
}));

const { gravarSubmissao, marcarEnviado } = await import("../api/src/armazenamento");

const submissao = {
  nome: "Maria Silva",
  email: "maria@empresa.com.br",
  mensagem: "Gostaria de automatizar a conferência de notas fiscais.",
  empresa: "Acme Ltda",
  segmento: "Indústria",
  funcionarios: "11 a 50",
  ip: "203.0.113.7",
};

const ROW_KEY = "2026-09-10T12:00:00.000Z-abc";

beforeEach(() => {
  vi.clearAllMocks();
  criarEntidade.mockResolvedValue({});
  atualizarEntidade.mockResolvedValue({});
  criarTabela.mockResolvedValue({});
});

describe("gravarSubmissao", () => {
  it("devolve o rowKey da linha gravada", async () => {
    const rowKey = await gravarSubmissao(submissao, "conexao-fake");
    expect(rowKey).toBeTruthy();
    expect(criarEntidade).toHaveBeenCalledOnce();
  });

  it("particiona por ano-mês", async () => {
    await gravarSubmissao(submissao, "conexao-fake");
    const entidade = criarEntidade.mock.calls[0][0];
    expect(entidade.partitionKey).toMatch(/^\d{4}-\d{2}$/);
  });

  it("grava enviado como false", async () => {
    await gravarSubmissao(submissao, "conexao-fake");
    expect(criarEntidade.mock.calls[0][0].enviado).toBe(false);
  });

  it("grava todos os campos do formulário mais o IP", async () => {
    await gravarSubmissao(submissao, "conexao-fake");
    const e = criarEntidade.mock.calls[0][0];
    expect(e.nome).toBe("Maria Silva");
    expect(e.email).toBe("maria@empresa.com.br");
    expect(e.mensagem).toContain("notas fiscais");
    expect(e.ip).toBe("203.0.113.7");
  });

  it("grava o contexto opcional da empresa", async () => {
    await gravarSubmissao(submissao, "conexao-fake");
    const e = criarEntidade.mock.calls[0][0];
    expect(e.empresa).toBe("Acme Ltda");
    expect(e.segmento).toBe("Indústria");
    expect(e.funcionarios).toBe("11 a 50");
  });

  it("gera rowKeys distintos para submissões de fato simultâneas", async () => {
    // O teste anterior fazia duas chamadas sequenciais com await: passaria
    // ate se chaveLinha usasse so um contador. O que precisa de prova e o
    // caso real — varias submissoes no MESMO milissegundo, onde so o sufixo
    // aleatorio separa as chaves.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-10T12:00:00.000Z"));
    const chaves = await Promise.all(
      Array.from({ length: 200 }, () => gravarSubmissao(submissao, "conexao-fake")),
    );
    expect(new Set(chaves).size).toBe(200);
    // Todas partilham o mesmo carimbo de tempo: a distincao veio do sufixo.
    expect(new Set(chaves.map((k) => k!.split("-").slice(0, 3).join("-"))).size).toBe(1);
    vi.useRealTimers();
  });

  it("o prefixo do rowKey é igual à partição", async () => {
    // marcarEnviado deriva a particao de rowKey.slice(0,7). Se este
    // acordo quebrar, a atualizacao mira uma linha inexistente.
    const rowKey = await gravarSubmissao(submissao, "conexao-fake");
    const { partitionKey } = criarEntidade.mock.calls[0][0];
    expect(rowKey!.slice(0, 7)).toBe(partitionKey);
  });

  it("devolve null quando a gravação falha", async () => {
    criarEntidade.mockRejectedValue(new Error("storage fora do ar"));
    expect(await gravarSubmissao(submissao, "conexao-fake")).toBeNull();
  });
});

describe("marcarEnviado", () => {
  it("atualiza a linha com enviado true", async () => {
    await marcarEnviado(ROW_KEY, "conexao-fake");
    const entidade = atualizarEntidade.mock.calls[0][0];
    expect(entidade.enviado).toBe(true);
    expect(entidade.rowKey).toBe(ROW_KEY);
    expect(entidade.partitionKey).toBe("2026-09");
  });

  it("não lança quando a atualização falha", async () => {
    atualizarEntidade.mockRejectedValue(new Error("conflito"));
    await expect(marcarEnviado(ROW_KEY, "conexao-fake")).resolves.toBeUndefined();
  });
});
