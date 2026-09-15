import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * As páginas legais não podem ir ao ar com marcador de rascunho.
 *
 * Privacidade e Termos nasceram com `[razão social]`, `[CNPJ]`, `[cidade/UF]`
 * e `[definir prazo de retenção]` — e ficaram publicadas assim. É uma falha
 * particular destas duas páginas: ninguém as abre no dia a dia, então o
 * rascunho sobrevive ao deploy e fica visível justamente para quem foi
 * conferir se a empresa é séria.
 */

const raiz = fileURLToPath(new URL("../public/", import.meta.url));
const documentos = ["privacidade.html", "termos.html"] as const;

describe("as páginas legais", () => {
  for (const nome of documentos) {
    const html = readFileSync(`${raiz}${nome}`, "utf8");

    it(`${nome} não tem marcador por preencher`, () => {
      const corpo = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/g, "");
      const marcadores = corpo.match(/\[[^\]\n]{2,40}\]/g) ?? [];
      expect(marcadores).toEqual([]);
    });

    it(`${nome} não expõe dado cadastral da empresa`, () => {
      // CNPJ e razão social foram deliberadamente deixados de fora: a página
      // identifica quem responde pelo site e oferece um e-mail, que é o que o
      // visitante precisa para exercer os direitos dela.
      expect(html).not.toMatch(/\bCNPJ\b/);
      expect(html).not.toMatch(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
    });

    it(`${nome} diz como falar com o responsável`, () => {
      // Uma política sem canal de contato não serve ao seu propósito: os
      // direitos que ela descreve só existem se houver para onde escrever.
      expect(html).toContain("mailto:contato@alvesmaia.com");
    });
  }
});
