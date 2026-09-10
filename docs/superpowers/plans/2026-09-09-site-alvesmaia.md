# Site Institucional Alvesmaia — Plano de Implementação

> **Para executores agênticos:** SUB-SKILL OBRIGATÓRIA: use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para implementar tarefa a tarefa. Os passos usam checkbox (`- [ ]`) para acompanhamento.

**Objetivo:** Publicar um site institucional de 4 páginas para a Alvesmaia em `alvesmaia.com`, com formulário de contato que grava toda submissão e entrega e-mail de verdade.

**Arquitetura:** HTML/CSS estático servido pelo Azure Static Web Apps, sem build step e sem JavaScript próprio. O formulário faz `POST` clássico para uma Azure Function em TypeScript, que valida os dados, confere o Cloudflare Turnstile, grava no Azure Table Storage e envia o e-mail pelo Microsoft Graph usando o tenant do Microsoft 365 já contratado.

**Tech Stack:** HTML5, CSS puro (custom properties), TypeScript, Azure Functions (Node 20, modelo de programação v4), Azure Table Storage (`@azure/data-tables`), Microsoft Graph, Cloudflare Turnstile, Vitest (só desenvolvimento).

**Spec:** `docs/superpowers/specs/2026-09-09-site-alvesmaia-design.md`

## Estado atual

Tasks 1 a 4 estão **concluídas e commitadas**. A migração de Cloudflare Pages para Azure (10/09/2026) não as afeta — HTML, CSS, tokens e a lógica de validação são independentes de runtime.

| Task | Commit | Situação |
|---|---|---|
| 1 Fundação e página inicial | `30b38c9` | concluída |
| 2 Serviços e Sobre | `7d50f4c` | concluída |
| 3 Contato com formulário | `339987a` | concluída |
| 4 Validação (9 testes) | `30d41d5` | concluída, precisa ser **realocada** (Task 5) |
| ~~5 Pages Function~~ | `75118d6` | **descartada** — reescrita nas Tasks 7 a 9 |

## Restrições Globais

- **Zero JavaScript próprio no site publicado.** Menu mobile em CSS puro (checkbox + `:checked`), avisos de estado por `:target`. O único `<script>` é o widget do Turnstile, só em `contato.html`.
- **Zero build step para o site.** O Azure serve `public/` direto. A pasta `api/` é compilada à parte.
- **Idioma:** todo o conteúdo visível em português do Brasil, com acentuação correta.
- **Contraste:** o ciano da marca `#00A8E8` reprova sobre branco (2,70:1). Para texto e links usar `--am-ciano-700` (`#0077AB`). Ciano puro só em elementos gráficos.
- **Voz institucional, sem inventar estrutura.** Quem fala é a Alvesmaia. Proibido "nossa equipe de especialistas" e qualquer coisa que sugira uma estrutura que não existe — a página Sobre declara explicitamente que a operação é enxuta.
- **Tema único, claro.** Nenhum bloco `prefers-color-scheme` no CSS. Navy só em cabeçalho, hero e rodapé.
- **Segredos nunca no repositório.** `GRAPH_CLIENT_SECRET`, `TURNSTILE_SECRET_KEY` e `TABLES_CONNECTION_STRING` só como Application Settings no SWA. A site key do Turnstile é pública e fica no HTML.
- **Turnstile: três checagens.** `success`, `action` e `hostname`. Só `success` deixa um token de outro formulário ou de outro site passar.
- **Não tocar em registros de e-mail.** MX, SPF, DKIM e DMARC de `alvesmaia.com` estão em produção. Só se criam um `TXT` de validação e um `CNAME` para `www`.
- **Gravar antes de enviar.** A submissão vai para o Table Storage antes da chamada ao Graph. Se o envio falhar, o lead não se perde.
- **`Mail.Send` restrita.** Sem a Application Access Policy limitando o app a `no-reply@alvesmaia.com`, o projeto não vai ao ar.

---

## Estrutura de arquivos

```
alvesmaia-site/
├── api/                          Azure Functions app (compilado à parte)
│   ├── host.json
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── validacao.ts          Lógica pura de validação (movida da raiz)
│       ├── armazenamento.ts      Gravação e atualização no Table Storage
│       ├── graph.ts              Token do Entra + envio pelo Graph
│       ├── turnstile.ts          Verificação server-side do Turnstile
│       └── functions/
│           └── contato.ts        Handler HTTP: orquestra os quatro acima
├── tests/                        Testes (Vitest, na raiz)
│   ├── validacao.test.ts
│   ├── armazenamento.test.ts
│   ├── graph.test.ts
│   └── contato.test.ts
├── public/                       Servido pelo SWA — já pronto
│   ├── index.html · servicos.html · sobre.html · contato.html
│   ├── css/tokens.css · css/site.css
│   └── img/
├── staticwebapp.config.json      Rotas e cabeçalhos do SWA
├── docs/superpowers/
├── package.json                  Só devDependencies (Vitest, tsc)
└── .gitignore
```

**Responsabilidade de cada arquivo:**

| Arquivo | Responsabilidade única |
|---|---|
| `api/src/validacao.ts` | Decidir se os dados são válidos. Sem I/O, sem rede. |
| `api/src/turnstile.ts` | Dizer se o token do Turnstile é válido. |
| `api/src/armazenamento.ts` | Gravar e atualizar a submissão. Não sabe o que é e-mail. |
| `api/src/graph.ts` | Obter token e enviar e-mail. Não sabe o que é HTTP request. |
| `api/src/functions/contato.ts` | Orquestrar os quatro acima e decidir o redirecionamento. |

---

## Task 5: Realocar a validação e remover a Pages Function

A lógica de validação e seus 9 testes são aproveitados integralmente. O que muda é onde moram: o SWA compila a pasta `api/` isoladamente, então código importado por ela precisa estar dentro dela.

**Files:**
- Move: `src/validacao.ts` → `api/src/validacao.ts`
- Delete: `functions/api/contato.ts`, `tests/contato.test.ts`, `tsconfig.json` da raiz
- Modify: `tests/validacao.test.ts` (caminho do import)

**Interfaces:**
- Produz: `api/src/validacao.ts` exportando `DadosContato` e `validarFormulario(d) => string[]`. Todas as tasks seguintes importam daqui.

- [ ] **Passo 1: Mover a validação e apagar o que foi descartado**

```bash
cd C:/PROJETOS/alvesmaia-site
mkdir -p api/src/functions
git mv src/validacao.ts api/src/validacao.ts
git rm -r --quiet functions tests/contato.test.ts tsconfig.json
rmdir src 2>/dev/null || true
```

- [ ] **Passo 2: Corrigir o import no teste**

Em `tests/validacao.test.ts`, trocar a linha do import:

```typescript
import { validarFormulario } from "../api/src/validacao";
```

- [ ] **Passo 3: Rodar os testes**

```bash
npx vitest run
```

Esperado: 9 testes passando, 1 arquivo. Se acusar `contato.test.ts` faltando, o `git rm` não pegou — confira com `git status`.

- [ ] **Passo 4: Commit**

```bash
git add -A
git commit -m "refactor: move validacao para api/ e remove a Pages Function

O SWA compila api/ isoladamente, entao codigo importado pela Function
precisa morar dentro dela. A logica de validacao e seus 9 testes sao
aproveitados sem alteracao.

A Pages Function foi descartada na migracao para Azure — sera reescrita
como Azure Function nas tasks seguintes.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QssWCvHSMwSCEjdqbHeMPd"
```

---

## Task 6: Esqueleto da Azure Functions app

**Files:**
- Create: `api/package.json`, `api/host.json`, `api/tsconfig.json`, `api/.funcignore`
- Create: `staticwebapp.config.json`
- Modify: `package.json` (raiz), `.gitignore`

**Interfaces:**
- Produz: a pasta `api/` reconhecível pelo SWA, com `@azure/functions` v4 e `@azure/data-tables` instalados. As Tasks 7 a 9 escrevem dentro dela.

- [ ] **Passo 1: Criar `api/package.json`**

```json
{
  "name": "alvesmaia-api",
  "version": "1.0.0",
  "private": true,
  "main": "dist/src/functions/*.js",
  "scripts": {
    "build": "tsc",
    "prestart": "npm run build",
    "start": "func start"
  },
  "dependencies": {
    "@azure/functions": "^4.6.0",
    "@azure/data-tables": "^13.3.0"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "@types/node": "^22.10.2"
  }
}
```

O campo `main` aponta para o JavaScript compilado — é assim que o modelo v4 descobre as funções registradas.

- [ ] **Passo 2: Criar `api/host.json`**

```json
{
  "version": "2.0",
  "logging": {
    "applicationInsights": {
      "samplingSettings": { "isEnabled": true, "excludedTypes": "Request" }
    }
  },
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  }
}
```

- [ ] **Passo 3: Criar `api/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "lib": ["ES2022"],
    "types": ["node"],
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "noUnusedLocals": true,
    "skipLibCheck": true,
    "sourceMap": true
  },
  "include": ["src"]
}
```

`module: CommonJS` não é preferência — é o que o runtime do Azure Functions espera no modelo v4.

- [ ] **Passo 4: Criar `api/.funcignore`**

```
*.ts
tsconfig.json
.vscode
```

- [ ] **Passo 5: Criar `staticwebapp.config.json` na raiz**

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/css/*", "/img/*", "/api/*"]
  },
  "globalHeaders": {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  }
}
```

- [ ] **Passo 6: Substituir o `package.json` da raiz**

```json
{
  "name": "alvesmaia-site",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "tipos": "tsc --noEmit -p api/tsconfig.json",
    "verificar": "npm run tipos && npm test"
  },
  "devDependencies": {
    "vitest": "^2.1.8",
    "typescript": "^5.7.2",
    "@types/node": "^22.10.2"
  }
}
```

Os pacotes do Azure **não** entram aqui. Ficam só em `api/package.json`, e o
`vitest.config.ts` do passo seguinte aponta os testes para essa cópia. Instalar nos
dois lugares cria duas cópias físicas, e aí `vi.mock` intercepta a da raiz enquanto o
módulo sob teste carrega a de `api/` — o mock não pega e o teste chama o SDK de verdade.

- [ ] **Passo 7: Criar `vitest.config.ts` na raiz**

```typescript
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const naApi = (pacote: string) =>
  fileURLToPath(new URL(`./api/node_modules/${pacote}`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@azure/data-tables": naApi("@azure/data-tables"),
      "@azure/functions": naApi("@azure/functions"),
    },
  },
});
```

Sem estes alias os testes das Tasks 7 e 9 falham de um jeito confuso: o mock parece
correto, mas o SDK real é chamado.

- [ ] **Passo 8: Acrescentar ao `.gitignore`**

```
api/node_modules/
api/dist/
api/local.settings.json
```

O `local.settings.json` guarda segredos de desenvolvimento local. Nunca versionar.

- [ ] **Passo 9: Instalar e verificar**

```bash
cd C:/PROJETOS/alvesmaia-site
npm install
cd api && npm install && cd ..
npm run verificar
```

Esperado: `tsc` sem erros e 9 testes passando.

- [ ] **Passo 10: Commit**

```bash
git add -A
git commit -m "feat: esqueleto da Azure Functions app

Modelo de programacao v4, TypeScript compilado para CommonJS — o runtime
do Functions exige. staticwebapp.config.json com cabecalhos de seguranca
e fallback de navegacao.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QssWCvHSMwSCEjdqbHeMPd"
```

---

## Task 7: Persistência no Table Storage (TDD)

**Files:**
- Create: `api/src/armazenamento.ts`
- Test: `tests/armazenamento.test.ts`

**Interfaces:**
- Consome: `DadosContato` de `api/src/validacao.ts`
- Produz:
  - `interface Submissao extends DadosContato { ip: string }`
  - `gravarSubmissao(s: Submissao, conexao: string) => Promise<string | null>` — devolve o `rowKey` gravado, ou `null` se falhou
  - `marcarEnviado(rowKey: string, conexao: string) => Promise<void>` — nunca lança

- [ ] **Passo 1: Escrever os testes que falham**

Criar `tests/armazenamento.test.ts`:

```typescript
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
  assunto: "Orçamento",
  mensagem: "Gostaria de automatizar a conferência de notas fiscais.",
  ip: "203.0.113.7",
};

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
    expect(e.assunto).toBe("Orçamento");
    expect(e.mensagem).toContain("notas fiscais");
    expect(e.ip).toBe("203.0.113.7");
  });

  it("gera rowKeys distintos para submissões simultâneas", async () => {
    const a = await gravarSubmissao(submissao, "conexao-fake");
    const b = await gravarSubmissao(submissao, "conexao-fake");
    expect(a).not.toBe(b);
  });

  it("devolve null quando a gravação falha", async () => {
    criarEntidade.mockRejectedValue(new Error("storage fora do ar"));
    expect(await gravarSubmissao(submissao, "conexao-fake")).toBeNull();
  });
});

describe("marcarEnviado", () => {
  it("atualiza a linha com enviado true", async () => {
    await marcarEnviado("2026-09-10T12:00:00.000Z-abc", "conexao-fake");
    const entidade = atualizarEntidade.mock.calls[0][0];
    expect(entidade.enviado).toBe(true);
  });

  it("não lança quando a atualização falha", async () => {
    atualizarEntidade.mockRejectedValue(new Error("conflito"));
    await expect(
      marcarEnviado("2026-09-10T12:00:00.000Z-abc", "conexao-fake"),
    ).resolves.toBeUndefined();
  });
});
```

- [ ] **Passo 2: Rodar e confirmar que falha**

```bash
npx vitest run tests/armazenamento.test.ts
```

Esperado: FALHA, módulo `../api/src/armazenamento` não existe.

- [ ] **Passo 3: Implementar**

Criar `api/src/armazenamento.ts`:

```typescript
import { TableClient } from "@azure/data-tables";
import type { DadosContato } from "./validacao";

const TABELA = "submissoes";

export interface Submissao extends DadosContato {
  ip: string;
}

function cliente(conexao: string): TableClient {
  return TableClient.fromConnectionString(conexao, TABELA);
}

/** Chave de partição: ano-mês, para consultas por período ficarem baratas. */
function particao(agora: Date): string {
  return `${agora.getUTCFullYear()}-${String(agora.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * O timestamp sozinho colide quando duas submissões caem no mesmo
 * milissegundo, e a colisão descartaria uma delas silenciosamente.
 */
function chaveLinha(agora: Date): string {
  const sufixo = Math.random().toString(36).slice(2, 10);
  return `${agora.toISOString()}-${sufixo}`;
}

export async function gravarSubmissao(
  s: Submissao,
  conexao: string,
): Promise<string | null> {
  const agora = new Date();
  const rowKey = chaveLinha(agora);

  try {
    const tabela = cliente(conexao);
    // Idempotente: se a tabela já existe, o SDK ignora.
    await tabela.createTable();
    await tabela.createEntity({
      partitionKey: particao(agora),
      rowKey,
      nome: s.nome.trim(),
      email: s.email.trim(),
      assunto: s.assunto,
      mensagem: s.mensagem.trim(),
      ip: s.ip,
      enviado: false,
    });
    return rowKey;
  } catch (e) {
    console.error("Falha ao gravar a submissao:", e);
    return null;
  }
}

/**
 * Best-effort: a mensagem já foi entregue quando isto roda, então falhar
 * aqui não pode derrubar a requisição. Pior caso, a linha fica com
 * enviado:false e parece um falso negativo no relatório.
 *
 * A partição sai dos 7 primeiros caracteres do rowKey (AAAA-MM do ISO),
 * que é exatamente como chaveLinha() a monta.
 */
export async function marcarEnviado(rowKey: string, conexao: string): Promise<void> {
  try {
    await cliente(conexao).updateEntity(
      { partitionKey: rowKey.slice(0, 7), rowKey, enviado: true },
      "Merge",
    );
  } catch (e) {
    console.error("Falha ao marcar a submissao como enviada:", e);
  }
}
```

- [ ] **Passo 4: Rodar e confirmar que passa**

```bash
npx vitest run tests/armazenamento.test.ts
```

Esperado: 9 testes passando.

- [ ] **Passo 5: Commit**

```bash
git add api/src/armazenamento.ts tests/armazenamento.test.ts
git commit -m "feat: persistencia das submissoes no Table Storage

Grava antes de tentar enviar, para que uma falha no envio nao custe o lead.
rowKey combina timestamp e sufixo aleatorio: o timestamp sozinho colide
quando duas submissoes caem no mesmo milissegundo.

marcarEnviado nunca lanca — roda depois do e-mail ja ter saido.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QssWCvHSMwSCEjdqbHeMPd"
```

---

## Task 8: Turnstile e Microsoft Graph (TDD)

**Files:**
- Create: `api/src/turnstile.ts`, `api/src/graph.ts`
- Test: `tests/graph.test.ts`

**Interfaces:**
- Produz: `turnstileValido(token: string, segredo: string, ip: string | null) => Promise<boolean>`
- Produz: `interface ConfigGraph { tenantId: string; clientId: string; clientSecret: string }`
- Produz: `enviarEmail(d: DadosContato, cfg: ConfigGraph) => Promise<boolean>`

- [ ] **Passo 1: Criar `api/src/turnstile.ts`**

Sem teste próprio — é uma chamada HTTP de sete linhas, coberta indiretamente pelos testes do handler na Task 9.

```typescript
const VERIFICAR = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function turnstileValido(
  token: string,
  segredo: string,
  ip: string | null,
): Promise<boolean> {
  if (!token) return false;

  const corpo = new FormData();
  corpo.append("secret", segredo);
  corpo.append("response", token);
  if (ip) corpo.append("remoteip", ip);

  try {
    const r = await fetch(VERIFICAR, { method: "POST", body: corpo });
    const json = (await r.json()) as { success?: boolean };
    return json.success === true;
  } catch (e) {
    console.error("Falha ao verificar o Turnstile:", e);
    return false;
  }
}
```

- [ ] **Passo 2: Escrever os testes do Graph**

Criar `tests/graph.test.ts`:

```typescript
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
  assunto: "Orçamento",
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

function corpoDaChamadaGraph(spy: ReturnType<typeof mockFetch>) {
  const chamada = spy.mock.calls.find((c) => String(c[0]).includes("graph.microsoft.com"));
  return JSON.parse(String((chamada![1] as RequestInit).body));
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
    const url = String(spy.mock.calls.find((c) => String(c[0]).includes("graph.microsoft.com"))![0]);
    expect(url).toContain("no-reply%40alvesmaia.com");
    expect(corpoDaChamadaGraph(spy).message.toRecipients[0].emailAddress.address)
      .toBe("contato@alvesmaia.com");
  });

  it("põe o e-mail do visitante em replyTo", async () => {
    const spy = mockFetch();
    await enviarEmail(dados, cfg);
    expect(corpoDaChamadaGraph(spy).message.replyTo[0].emailAddress.address)
      .toBe("maria@empresa.com.br");
  });

  it("não guarda em Itens Enviados", async () => {
    const spy = mockFetch();
    await enviarEmail(dados, cfg);
    expect(corpoDaChamadaGraph(spy).saveToSentItems).toBe(false);
  });

  it("escapa HTML vindo do visitante", async () => {
    const spy = mockFetch();
    await enviarEmail({ ...dados, nome: "<script>alert(1)</script>" }, cfg);
    const html = corpoDaChamadaGraph(spy).message.body.content;
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
    expect(spy.mock.calls.filter((c) => String(c[0]).includes("graph.microsoft.com")))
      .toHaveLength(0);
  });

  it("devolve false quando o Graph recusa o envio", async () => {
    mockFetch({ envioOk: false });
    expect(await enviarEmail(dados, cfg)).toBe(false);
  });
});
```

- [ ] **Passo 3: Rodar e confirmar que falha**

```bash
npx vitest run tests/graph.test.ts
```

Esperado: FALHA, módulo `../api/src/graph` não existe.

- [ ] **Passo 4: Implementar**

Criar `api/src/graph.ts`:

```typescript
import type { DadosContato } from "./validacao";

const REMETENTE = "no-reply@alvesmaia.com";
const DESTINO = "contato@alvesmaia.com";

export interface ConfigGraph {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

async function obterToken(cfg: ConfigGraph): Promise<string | null> {
  const corpo = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  try {
    const r = await fetch(
      `https://login.microsoftonline.com/${cfg.tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: corpo.toString(),
      },
    );
    if (!r.ok) {
      // Quase sempre client secret expirado. Sem este log, some em silencio.
      console.error("Entra recusou o token:", r.status, await r.text());
      return null;
    }
    const json = (await r.json()) as { access_token?: string };
    return json.access_token ?? null;
  } catch (e) {
    console.error("Falha de rede ao obter o token do Entra:", e);
    return null;
  }
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function montarHtml(d: DadosContato): string {
  return (
    `<p><strong>Nome:</strong> ${escapar(d.nome.trim())}</p>` +
    `<p><strong>E-mail:</strong> ${escapar(d.email.trim())}</p>` +
    `<p><strong>Assunto:</strong> ${escapar(d.assunto)}</p>` +
    `<hr>` +
    `<p>${escapar(d.mensagem.trim()).replace(/\n/g, "<br>")}</p>`
  );
}

export async function enviarEmail(d: DadosContato, cfg: ConfigGraph): Promise<boolean> {
  const token = await obterToken(cfg);
  if (!token) return false;

  const mensagem = {
    message: {
      subject: `[Site] ${d.assunto} — ${d.nome.trim()}`,
      body: { contentType: "HTML", content: montarHtml(d) },
      toRecipients: [{ emailAddress: { address: DESTINO } }],
      // Responder no Outlook vai direto para o visitante.
      replyTo: [{ emailAddress: { address: d.email.trim() } }],
    },
    saveToSentItems: false,
  };

  try {
    const r = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(REMETENTE)}/sendMail`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mensagem),
      },
    );
    if (!r.ok) {
      // 403 aqui costuma ser a Application Access Policy barrando a caixa.
      console.error("Graph recusou o envio:", r.status, await r.text());
    }
    return r.ok;
  } catch (e) {
    console.error("Falha de rede ao chamar o Graph:", e);
    return false;
  }
}
```

- [ ] **Passo 5: Rodar e confirmar que passa**

```bash
npx vitest run tests/graph.test.ts
```

Esperado: 9 testes passando.

- [ ] **Passo 6: Commit**

```bash
git add api/src/turnstile.ts api/src/graph.ts tests/graph.test.ts
git commit -m "feat: verificacao do Turnstile e envio pelo Microsoft Graph

Client credentials contra o Entra, depois sendMail como no-reply@. O
e-mail do visitante vai em replyTo, para responder direto pelo Outlook.
Conteudo escapado antes de virar HTML.

Cada falha registra status e corpo: token recusado quase sempre e secret
expirado, e 403 no envio costuma ser a Application Access Policy.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QssWCvHSMwSCEjdqbHeMPd"
```

---

## Task 9: Handler HTTP `/api/contato` (TDD)

**Files:**
- Create: `api/src/functions/contato.ts`
- Test: `tests/contato.test.ts`

**Interfaces:**
- Consome: `validarFormulario`, `turnstileValido`, `gravarSubmissao`, `marcarEnviado`, `enviarEmail`
- Consome: nomes de campo do formulário em `public/contato.html` — `nome`, `email`, `assunto`, `mensagem`, `cf-turnstile-response`
- Produz: respostas 303 para `/contato.html#enviado`, `#erro`, `#robo`

- [ ] **Passo 1: Escrever os testes que falham**

Criar `tests/contato.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const turnstileValido = vi.fn();
const gravarSubmissao = vi.fn();
const marcarEnviado = vi.fn();
const enviarEmail = vi.fn();

vi.mock("../api/src/turnstile", () => ({ turnstileValido }));
vi.mock("../api/src/armazenamento", () => ({ gravarSubmissao, marcarEnviado }));
vi.mock("../api/src/graph", () => ({ enviarEmail }));
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
    expect(res.headers?.Location).toBe("/contato.html#enviado");
  });

  it("redireciona para #erro quando a validação falha", async () => {
    const res = await chamar({ ...camposValidos, email: "invalido" });
    expect(res.headers?.Location).toBe("/contato.html#erro");
  });

  it("não grava nem envia quando a validação falha", async () => {
    await chamar({ ...camposValidos, nome: "" });
    expect(gravarSubmissao).not.toHaveBeenCalled();
    expect(enviarEmail).not.toHaveBeenCalled();
  });

  it("redireciona para #robo quando o Turnstile reprova", async () => {
    turnstileValido.mockResolvedValue(false);
    const res = await chamar();
    expect(res.headers?.Location).toBe("/contato.html#robo");
  });

  it("não grava quando o Turnstile reprova", async () => {
    turnstileValido.mockResolvedValue(false);
    await chamar();
    expect(gravarSubmissao).not.toHaveBeenCalled();
  });

  it("grava antes de enviar", async () => {
    await chamar();
    expect(gravarSubmissao.mock.invocationCallOrder[0])
      .toBeLessThan(enviarEmail.mock.invocationCallOrder[0]);
  });

  it("passa o IP de origem para a gravação", async () => {
    await chamar();
    expect(gravarSubmissao.mock.calls[0][0].ip).toBe("203.0.113.7");
  });

  it("não tenta enviar quando a gravação falha", async () => {
    gravarSubmissao.mockResolvedValue(null);
    const res = await chamar();
    expect(enviarEmail).not.toHaveBeenCalled();
    expect(res.headers?.Location).toBe("/contato.html#erro");
  });

  it("marca como enviado quando o Graph aceita", async () => {
    await chamar();
    expect(marcarEnviado).toHaveBeenCalledWith(ROW_KEY, "conexao");
  });

  it("redireciona para #erro e não marca quando o Graph recusa", async () => {
    enviarEmail.mockResolvedValue(false);
    const res = await chamar();
    expect(marcarEnviado).not.toHaveBeenCalled();
    expect(res.headers?.Location).toBe("/contato.html#erro");
  });

  it("redireciona para #erro quando falta configuração", async () => {
    delete process.env.GRAPH_CLIENT_SECRET;
    const res = await chamar();
    expect(res.headers?.Location).toBe("/contato.html#erro");
    expect(gravarSubmissao).not.toHaveBeenCalled();
  });
});
```

- [ ] **Passo 2: Rodar e confirmar que falha**

```bash
npx vitest run tests/contato.test.ts
```

Esperado: FALHA, módulo `../api/src/functions/contato` não existe.

- [ ] **Passo 3: Implementar**

Criar `api/src/functions/contato.ts`:

```typescript
import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from "@azure/functions";
import { validarFormulario, type DadosContato } from "../validacao";
import { turnstileValido } from "../turnstile";
import { gravarSubmissao, marcarEnviado } from "../armazenamento";
import { enviarEmail, type ConfigGraph } from "../graph";

function redirecionar(ancora: string): HttpResponseInit {
  return { status: 303, headers: { Location: `/contato.html#${ancora}` } };
}

interface Config {
  graph: ConfigGraph;
  turnstileSecret: string;
  conexaoTabelas: string;
}

/**
 * Falta de configuração é erro de operação, não do visitante. Detectar antes
 * de gravar evita uma linha órfã que nunca teria como ser enviada.
 */
function lerConfig(): Config | null {
  const {
    GRAPH_TENANT_ID,
    GRAPH_CLIENT_ID,
    GRAPH_CLIENT_SECRET,
    TURNSTILE_SECRET_KEY,
    TABLES_CONNECTION_STRING,
  } = process.env;

  if (
    !GRAPH_TENANT_ID ||
    !GRAPH_CLIENT_ID ||
    !GRAPH_CLIENT_SECRET ||
    !TURNSTILE_SECRET_KEY ||
    !TABLES_CONNECTION_STRING
  ) {
    return null;
  }

  return {
    graph: {
      tenantId: GRAPH_TENANT_ID,
      clientId: GRAPH_CLIENT_ID,
      clientSecret: GRAPH_CLIENT_SECRET,
    },
    turnstileSecret: TURNSTILE_SECRET_KEY,
    conexaoTabelas: TABLES_CONNECTION_STRING,
  };
}

export async function contato(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const config = lerConfig();
  if (!config) {
    context.error("Application Settings incompletas — o formulario nao pode operar");
    return redirecionar("erro");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch (e) {
    context.error("Corpo do formulario ilegivel:", e);
    return redirecionar("erro");
  }

  const dados: DadosContato = {
    nome: String(form.get("nome") ?? ""),
    email: String(form.get("email") ?? ""),
    assunto: String(form.get("assunto") ?? ""),
    mensagem: String(form.get("mensagem") ?? ""),
  };

  const erros = validarFormulario(dados);
  if (erros.length > 0) {
    context.error("Formulario invalido:", erros.join(", "));
    return redirecionar("erro");
  }

  const ip = request.headers.get("x-forwarded-for") ?? "";
  const token = String(form.get("cf-turnstile-response") ?? "");
  if (!(await turnstileValido(token, config.turnstileSecret, ip || null))) {
    return redirecionar("robo");
  }

  // Grava antes de enviar: se o Graph falhar, o lead continua recuperavel.
  const rowKey = await gravarSubmissao({ ...dados, ip }, config.conexaoTabelas);
  if (!rowKey) return redirecionar("erro");

  const enviado = await enviarEmail(dados, config.graph);
  if (!enviado) return redirecionar("erro");

  await marcarEnviado(rowKey, config.conexaoTabelas);
  return redirecionar("enviado");
}

app.http("contato", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "contato",
  handler: contato,
});
```

- [ ] **Passo 4: Rodar a verificação completa**

```bash
npm run verificar
```

Esperado: `tsc` sem erros e 52 testes passando (9 validação + 9 armazenamento + 12 turnstile + 9 graph + 13 contato).

- [ ] **Passo 5: Commit**

```bash
git add api/src/functions/contato.ts tests/contato.test.ts
git commit -m "feat: handler HTTP do formulario de contato

Orquestra validacao, Turnstile, gravacao e envio. Grava antes de enviar,
e so marca como enviado depois do Graph confirmar.

Configuracao incompleta e detectada antes de gravar: sem isso ficaria uma
linha orfa que nunca teria como ser enviada.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QssWCvHSMwSCEjdqbHeMPd"
```

---

## Task 10: Provisionar o Azure e publicar

Passos marcados **[USUÁRIO]** exigem contas, cartão ou consentimento de administrador. O executor não os faz.

**Files:**
- Modify: `public/contato.html` (site key do Turnstile)

- [ ] **Passo 1: [USUÁRIO] Criar o widget do Turnstile**

Painel da Cloudflare → Turnstile → Add site. Domínio `alvesmaia.com`, modo **Managed**.
Copiar a **site key** (pública) e a **secret key** (privada).

- [ ] **Passo 2: Colar a site key no HTML**

Em `public/contato.html`, trocar `COLAR_SITE_KEY_AQUI` pela site key real. Ela é pública, pode ir para o repositório.

```bash
git add public/contato.html
git commit -m "chore: site key do Turnstile

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QssWCvHSMwSCEjdqbHeMPd"
git push
```

- [ ] **Passo 3: [USUÁRIO] Registrar o app no Entra**

Portal do Azure → Microsoft Entra ID → App registrations → New registration.

| Campo | Valor |
|---|---|
| Nome | `alvesmaia-site-formulario` |
| Tipos de conta | Somente este diretório organizacional |
| Redirect URI | deixar vazio |

Depois de criar, anotar **Application (client) ID** e **Directory (tenant) ID**.

Em **API permissions** → Add a permission → Microsoft Graph → **Application permissions** → `Mail.Send` → Add. Em seguida **Grant admin consent**.

Em **Certificates & secrets** → New client secret → validade 24 meses. Copiar o **Value** na hora; ele não é exibido de novo. **Colocar a data de expiração no calendário agora.**

- [ ] **Passo 4: [USUÁRIO] Restringir a permissão a uma única caixa**

Sem isto, o app pode enviar como qualquer pessoa do tenant. Não é opcional.

```powershell
Install-Module -Name ExchangeOnlineManagement -Scope CurrentUser
Connect-ExchangeOnline -UserPrincipalName uemerson@alvesmaia.com

New-ApplicationAccessPolicy `
  -AppId "<Application (client) ID do passo 3>" `
  -PolicyScopeGroupId "no-reply@alvesmaia.com" `
  -AccessRight RestrictAccess `
  -Description "Formulario do site: so pode enviar como no-reply"
```

Conferir que ficou restrito:

```powershell
Test-ApplicationAccessPolicy -Identity no-reply@alvesmaia.com -AppId "<client id>"
Test-ApplicationAccessPolicy -Identity uemerson@alvesmaia.com -AppId "<client id>"
```

Esperado: `AccessCheckResult: Granted` no primeiro, **`Denied` no segundo**. Se o segundo vier `Granted`, a política não aplicou — não prosseguir.

- [ ] **Passo 5: [USUÁRIO] Criar a Storage Account**

Portal do Azure → Storage accounts → Create.

| Campo | Valor |
|---|---|
| Resource group | `rg-alvesmaia-site` (criar) |
| Nome | `stalvesmaiasite` |
| Região | Brazil South |
| Performance | Standard |
| Redundância | LRS |

Depois: Security + networking → Access keys → copiar a **Connection string** da key1.

- [ ] **Passo 6: [USUÁRIO] Criar o Static Web App**

Portal do Azure → Static Web Apps → Create.

| Campo | Valor |
|---|---|
| Resource group | `rg-alvesmaia-site` |
| Nome | `swa-alvesmaia-site` |
| Plano | **Free** |
| Origem | GitHub → `alvesmaia/alvesmaia-site`, branch `main` |
| Build preset | Custom |
| App location | `public` |
| Api location | `api` |
| Output location | *(vazio)* |

O Azure cria o GitHub Action e dispara o primeiro deploy sozinho.

- [ ] **Passo 7: Conferir o workflow criado**

```bash
cd C:/PROJETOS/alvesmaia-site
git pull
cat .github/workflows/azure-static-web-apps-*.yml | grep -A3 'app_location'
gh run list --limit 3
```

Confirmar que `app_location` é `public` e `api_location` é `api`.

- [ ] **Passo 8: [USUÁRIO] Cadastrar as Application Settings**

SWA → Settings → Environment variables → Add, uma por uma:

| Nome | Origem |
|---|---|
| `GRAPH_TENANT_ID` | Directory (tenant) ID, passo 3 |
| `GRAPH_CLIENT_ID` | Application (client) ID, passo 3 |
| `GRAPH_CLIENT_SECRET` | Value do client secret, passo 3 |
| `TURNSTILE_SECRET_KEY` | secret key, passo 1 |
| `TURNSTILE_HOSTNAMES` | `alvesmaia.com,www.alvesmaia.com` — sem `localhost` |
| `TABLES_CONNECTION_STRING` | Connection string, passo 5 |

Salvar. O SWA reinicia a Function sozinho.

- [ ] **Passo 9: [USUÁRIO] Criar o alerta de orçamento**

Portal do Azure → Cost Management → Budgets → Add. Escopo `rg-alvesmaia-site`, valor **US$ 1**, alerta em 100%, e-mail `uemerson@alvesmaia.com`.

- [ ] **Passo 10: Apontar o domínio**

SWA → Custom domains → Add. Primeiro `www.alvesmaia.com` (CNAME), depois `alvesmaia.com` (apex, validação por TXT).

Na Cloudflare, criar os registros que o Azure indicar. **Proxy desligado (nuvem cinza)** — o proxy da Cloudflare na frente do SWA quebra a validação do certificado.

Atenção ao adicionar o TXT no apex: é um TXT **a mais**, ao lado do SPF existente. Não substituir nada.

- [ ] **Passo 11: Verificação de regressão do e-mail**

O passo mais importante desta task.

```bash
nslookup -type=MX alvesmaia.com 173.245.58.108
nslookup -type=TXT alvesmaia.com 173.245.58.108
nslookup -type=TXT _dmarc.alvesmaia.com 173.245.58.108
nslookup -type=CNAME selector1._domainkey.alvesmaia.com 173.245.58.108
```

Esperado, sem nenhuma alteração:
- MX → `alvesmaia-com.mail.protection.outlook.com`
- TXT → `v=spf1 include:spf.protection.outlook.com ~all` (mais o TXT de validação do Azure, que é esperado)
- `_dmarc` → `v=DMARC1; p=none; rua=mailto:...@dmarc-reports.cloudflare.net`
- `selector1._domainkey` → `...dkim.mail.microsoft`

Se qualquer um tiver mudado, **parar e reverter o domínio customizado** antes de continuar.

- [ ] **Passo 12: Checklist de verificação manual**

Executar os 11 itens da seção "Verificação" da spec. Os dois que não podem ser pulados:

- **Item 10:** confirmar pelo `Test-ApplicationAccessPolicy` que o app **não** envia como `uemerson@alvesmaia.com`
- **Item 11:** o passo 11 acima

---

## Notas para o executor

**Sobre a duplicação de cabeçalho e rodapé:** é intencional, decidida na spec. Ao alterar navegação ou rodapé, alterar nos 4 arquivos. Conferir com:

```bash
grep -c "cabecalho__nav" public/*.html
```

Esperado: `1` em cada um dos 4 arquivos.

**Sobre o JavaScript:** o único `<script>` do site é o widget do Turnstile, carregado da Cloudflare, apenas em `contato.html`. Nenhum JavaScript próprio. Se surgir vontade de adicionar, revisar a spec antes.

**Sobre CommonJS na pasta `api/`:** o `package.json` da raiz é `"type": "module"`, mas o `api/tsconfig.json` compila para CommonJS. Não é inconsistência — é o que o runtime do Azure Functions v4 espera. Não "corrigir".

**Sobre o client secret:** se aparecer em qualquer arquivo commitado, é incidente de segurança — revogar no Entra imediatamente e gerar outro.
