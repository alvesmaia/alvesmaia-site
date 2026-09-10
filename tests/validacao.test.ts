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

  it("não deixa o contexto interferir na validação dos campos obrigatórios", () => {
    expect(validarFormulario(valido)).toEqual([]);
  });
});
