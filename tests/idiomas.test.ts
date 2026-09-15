import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * As duas versões do site não podem divergir em ESTRUTURA.
 *
 * O site é bilíngue por duplicação de arquivo — `/` em português, `/en/` em
 * inglês — e não por dicionário em JavaScript. A escolha foi deliberada: cada
 * idioma é uma URL indexável, com `hreflang`, e o texto chega ao buscador no
 * HTML servido. O custo conhecido é este: toda edição de conteúdo precisa ser
 * feita duas vezes, e o histórico do repositório mostra que a copy muda com
 * frequência ("troca o compromisso", "novo título da seção").
 *
 * Sem uma trava, a falha é previsível e silenciosa: alguém acrescenta uma
 * seção ao português, esquece o inglês, e a versão em inglês passa meses
 * incompleta sem ninguém abrir. Estes testes falham no mesmo commit.
 *
 * Eles comparam ESQUELETO, não texto: ids de seção, número de cartões, campos
 * do formulário. O texto TEM de diferir — é o objetivo do arquivo.
 */

const raiz = fileURLToPath(new URL("../public/", import.meta.url));
const pt = readFileSync(`${raiz}index.html`, "utf8");
const en = readFileSync(`${raiz}en/index.html`, "utf8");

/** Ocorrências de um padrão, em ordem de aparição. */
function todos(html: string, padrao: RegExp): string[] {
  return [...html.matchAll(padrao)].map((m) => m[1]);
}

describe("as duas versões do site", () => {
  it("têm as mesmas seções, na mesma ordem", () => {
    const re = /<section[^>]*\sid="([^"]+)"/g;
    expect(todos(en, re)).toEqual(todos(pt, re));
  });

  it("têm os mesmos destinos de navegação", () => {
    // Âncoras internas: se uma seção nasce no português e não no inglês, o
    // menu de lá aponta para uma âncora que não existe e o clique não faz nada.
    const re = /<a[^>]*\shref="(#[^"]+)"/g;
    expect(new Set(todos(en, re))).toEqual(new Set(todos(pt, re)));
  });

  it("têm o mesmo número de cartões, células e planos", () => {
    for (const classe of ["card", "celula", "plano", "etapa"]) {
      const re = new RegExp(`class="${classe}(?:[ "])`, "g");
      expect(en.match(re)?.length ?? 0, `blocos .${classe}`).toBe(
        pt.match(re)?.length ?? 0,
      );
    }
  });

  it("têm os mesmos campos de formulário", () => {
    // O formulário é o objetivo do site. Um campo a menos no inglês significa
    // um lead chegando sem a informação que o outro idioma coleta.
    const re = /\sname="([^"]+)"/g;
    expect(new Set(todos(en, re))).toEqual(new Set(todos(pt, re)));
  });

  it("declaram o próprio idioma", () => {
    expect(pt).toMatch(/<html lang="pt-BR"/);
    expect(en).toMatch(/<html lang="en"/);
  });

  it("apontam uma para a outra com hreflang", () => {
    // Sem os alternates, o buscador trata as duas como páginas concorrentes em
    // vez de traduções — e pode indexar só uma delas.
    for (const [nome, html] of [
      ["pt", pt],
      ["en", en],
    ] as const) {
      expect(html, nome).toContain('hreflang="pt-BR" href="https://alvesmaia.com/"');
      expect(html, nome).toContain('hreflang="en" href="https://alvesmaia.com/en/"');
      expect(html, nome).toContain('hreflang="x-default"');
    }
  });

  it("trazem o seletor de idioma, com o idioma corrente marcado", () => {
    expect(pt).toContain('idioma__opcao--ativa" href="/" hreflang="pt-BR"');
    expect(en).toContain('idioma__opcao--ativa" href="/en/" hreflang="en"');
  });

  it("não deixam texto em português na versão em inglês", () => {
    // Acento é o rastro que uma string esquecida sempre deixa. Não é detector
    // de idioma — é detector de uma classe de erro, e o custo de um falso
    // negativo ("Power Platform") é uma string, não um teste em que ninguém
    // confia.
    const semBloco = en.replace(/<(svg|script|style)\b[\s\S]*?<\/\1>/g, "");
    const restos = [...semBloco.matchAll(/>([^<>]+)</g)]
      .map((m) => m[1].trim())
      .filter((t) => t && /[À-ſ]/.test(t));
    expect(restos).toEqual([]);
  });

  it("mantêm o mesmo conjunto de imagens", () => {
    // Uma imagem só num dos idiomas costuma ser edição feita de um lado só.
    const re = /<img[^>]*\ssrc="([^"]+)"/g;
    expect(new Set(todos(en, re))).toEqual(new Set(todos(pt, re)));
  });
});

describe("a troca de idioma", () => {
  const pt = readFileSync(`${raiz}index.html`, "utf8");
  const en = readFileSync(`${raiz}en/index.html`, "utf8");

  it("grava a escolha ao clicar, nas duas páginas", () => {
    /**
     * Sem isto o seletor fica quebrado para quem já chegou com `?lang=` uma
     * vez: a preferência guardada continua valendo, o clique em "PT" leva a
     * `/`, e o script do `<head>` de lá devolve a pessoa para `/en/`. Clicar e
     * não sair do lugar — com a causa numa chave de localStorage que ninguém
     * suspeitaria de abrir.
     */
    for (const [nome, html] of [
      ["pt", pt],
      ["en", en],
    ] as const) {
      expect(html, nome).toContain('closest("[data-idioma]")');
      expect(html, nome).toMatch(/setItem\("alvesmaia-idioma", alvo\.dataset\.idioma\)/);
    }
  });

  it("o host não serve o português no lugar do inglês", () => {
    /**
     * `navigationFallback` reescreve caminho desconhecido para `/index.html`.
     * Sem excluir `/en/*`, um deploy que perdesse `en/index.html` devolveria a
     * página em PORTUGUÊS com status 200 — e o visitante inglês veria o site
     * no idioma errado sem nenhum sinal de erro.
     */
    const cfg = JSON.parse(readFileSync(`${raiz}staticwebapp.config.json`, "utf8"));
    expect(cfg.navigationFallback.exclude).toContain("/en/*");
  });
});
