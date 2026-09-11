import { describe, it, expect } from "vitest";
import { validarFormulario, normalizarContexto } from "../api/src/validacao";

const valido = {
  nome: "Maria Silva",
  email: "maria@empresa.com.br",
  mensagem: "Gostaria de automatizar a conferência de notas fiscais.",
};

describe("validarFormulario", () => {
  it("aceita dados completos e corretos", () => {
    expect(validarFormulario(valido)).toEqual([]);
  });

  it("rejeita nome com menos de 2 caracteres", () => {
    expect(validarFormulario({ ...valido, nome: "M" })).toContain("nome");
  });

  it("rejeita nome só com espaços", () => {
    expect(validarFormulario({ ...valido, nome: "   " })).toContain("nome");
  });

  it("rejeita e-mail sem arroba", () => {
    expect(validarFormulario({ ...valido, email: "mariaempresa.com" })).toContain("email");
  });

  it("rejeita e-mail sem domínio", () => {
    expect(validarFormulario({ ...valido, email: "maria@" })).toContain("email");
  });

  it("aceita e-mail com subdomínio e TLD composto", () => {
    expect(validarFormulario({ ...valido, email: "m@mail.empresa.com.br" })).toEqual([]);
  });

  it("rejeita mensagem curta demais", () => {
    expect(validarFormulario({ ...valido, mensagem: "oi" })).toContain("mensagem_curta");
  });

  it("rejeita mensagem acima de 5000 caracteres", () => {
    expect(validarFormulario({ ...valido, mensagem: "a".repeat(5001) })).toContain("mensagem_longa");
  });

  it("acumula múltiplos erros de uma vez", () => {
    const erros = validarFormulario({ nome: "", email: "x", mensagem: "" });
    expect(erros).toContain("nome");
    expect(erros).toContain("email");
    expect(erros).toContain("mensagem_curta");
  });

  it("recusa endereços que a regex antiga deixava passar", () => {
    // Todos passavam antes e so falhavam la no Graph — que devolve 400 e
    // deixa a linha na tabela com enviado:false, sem ninguem olhando.
    for (const email of [
      "maria@empresa..com",
      "maria@-.com",
      "a@b.<script>",
      "maria@empresa.com>x",
      "maria@empresa.c",
      ".maria@empresa.com",
      "maria.@empresa.com",
      "maria@empresa",
    ]) {
      expect(validarFormulario({ ...valido, email })).toContain("email");
    }
  });

  it("aceita endereços legítimos", () => {
    for (const email of [
      "maria@empresa.com",
      "maria.silva+nf@sub.empresa.com.br",
      "a@b.co",
      "contato@alves-maia.com",
    ]) {
      expect(validarFormulario({ ...valido, email })).toEqual([]);
    }
  });

  it("recusa e-mail acima de 254 caracteres", () => {
    const email = "a".repeat(250) + "@empresa.com";
    expect(validarFormulario({ ...valido, email })).toContain("email");
  });

  it("recusa nome acima de 120 caracteres", () => {
    // Sem teto, o nome vira o assunto do e-mail e estoura o limite de 32K
    // por propriedade do Table Storage — o visitante ve "tente novamente em
    // alguns instantes" para um erro que nunca vai se resolver.
    const erros = validarFormulario({ ...valido, nome: "a".repeat(121) });
    expect(erros).toContain("nome_longo");
  });
});

describe("normalizarContexto", () => {
  it("apara espaços dos três campos", () => {
    expect(normalizarContexto({ empresa: "  Acme  ", segmento: " Indústria ", funcionarios: " 11 a 50 " }))
      .toEqual({ empresa: "Acme", segmento: "Indústria", funcionarios: "11 a 50" });
  });

  it("aceita os três em branco", () => {
    expect(normalizarContexto({ empresa: "", segmento: "", funcionarios: "" }))
      .toEqual({ empresa: "", segmento: "", funcionarios: "" });
  });

  it("corta texto acima de 120 caracteres", () => {
    // empresa é texto livre; sem teto vira vetor de abuso
    const { empresa } = normalizarContexto({ empresa: "a".repeat(500), segmento: "", funcionarios: "" });
    expect(empresa).toHaveLength(120);
  });

  it("corta por ponto de código, não por unidade UTF-16", () => {
    // 119 letras + 1 emoji = 120 pontos de codigo, mas 121 unidades UTF-16.
    // Um slice direto deixaria um substituto solto no fim — caractere
    // invalido, que chega corrompido no e-mail.
    const { empresa } = normalizarContexto({
      empresa: "a".repeat(119) + "🏭",
      segmento: "",
      funcionarios: "",
    });
    expect(Array.from(empresa)).toHaveLength(120);
    expect(empresa.endsWith("🏭")).toBe(true);
  });
});
