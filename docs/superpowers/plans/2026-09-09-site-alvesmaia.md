# Site Institucional Alvesmaia — Plano de Implementação

> **PLANO CONCLUÍDO, E PARCIALMENTE SUPERADO.** Leia isto antes de seguir
> qualquer passo.
>
> As Tasks 1 a 9 foram executadas e descrevem o site como ele era: **quatro
> páginas** (`index`, `servicos`, `contato`, `sobre`), sem JavaScript próprio.
> O redesenho v2, de 10/09/2026, transformou tudo em **uma página só**
> (`public/index.html`) com JavaScript para tema, carrossel e envio. Onde essas
> tasks falam em `contato.html` ou em quatro arquivos, estão descrevendo algo
> que não existe mais. A lógica do backend, essa sim, continua válida.
>
> A **Task 10** foi reescrita em 11/09/2026 e é o registro do que foi
> implantado de fato — inclusive de três armadilhas do Exchange que o plano
> original não previa e que custaram uma tarde.
>
> **Para executores agênticos:** SUB-SKILL OBRIGATÓRIA: use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para implementar tarefa a tarefa. Os passos usam checkbox (`- [ ]`) para acompanhamento.

**Objetivo:** Publicar um site institucional para a Alvesmaia em `alvesmaia.com`, com formulário de contato que grava toda submissão e entrega e-mail de verdade. *(Eram 4 páginas; o v2 consolidou em uma.)*

**Arquitetura:** HTML/CSS estático servido pelo Azure Static Web Apps, sem build step. *(O v2 acrescentou JavaScript próprio, sempre como progressive enhancement — sem ele o site e o formulário continuam funcionando.)* O formulário faz `POST` clássico para uma Azure Function em TypeScript, que valida os dados, confere o Cloudflare Turnstile, grava no Azure Table Storage e envia o e-mail pelo Microsoft Graph usando o tenant do Microsoft 365 já contratado.

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

> **EXECUTADA em 11/09/2026.** O que segue é o registro do que foi feito de
> fato, não um roteiro a executar. Quase tudo saiu por linha de comando, não
> pelo portal, e o caminho real divergiu do planejado em pontos que custaram
> horas — eles estão marcados como **armadilha**.

### O que existe hoje

| Recurso | Nome | Observação |
|---|---|---|
| Resource group | `rg-alvesmaia-site` | Brazil South |
| Storage | `stalvesmaiasite` | Standard_LRS, TLS 1.2, só HTTPS |
| Static Web App | `swa-alvesmaia-site` | Free, East US 2 |
| Domínios | `alvesmaia.com`, `www` | Ready, certificado DigiCert |
| App registration | `0bdf678a-ca4f-4e33-8107-b1dac150f765` | `Mail.Send` de aplicação |
| Caixa de envio | `no-reply@alvesmaia.com` | **Caixa compartilhada**, não alias |
| Grupo de escopo | `app-formulario-site@alvesmaia.com` | Existe só para dar escopo à policy |
| Orçamento | US$ 5/mês | Alertas em 80% e 100% |

### Identidade do remetente — o ponto que o plano original errava

O plano dizia para usar `no-reply@` como **alias** da caixa pessoal. Funciona
para enviar, mas **assina errado**: uma caixa tem um único nome de exibição e
todos os seus alias herdam ele. Pior, em mensagem interna o Outlook resolve o
remetente pelo catálogo da organização e ignora o nome declarado no cabeçalho
— a documentação diz que isso não é alterável nem pelo Exchange nem pelo
cliente. Declarar `from.name` no código não resolve; o campo nunca é
consultado.

Resultado prático: cada mensagem do formulário chegava assinada com o nome
pessoal do dono da caixa, mesmo com o endereço correto no rastreamento.

**Endereço que um sistema usa para enviar precisa ser caixa compartilhada.**
Ela é gratuita e não consome licença.

### Restringir o `Mail.Send` — e as três armadilhas

`Mail.Send` como permissão de aplicação autoriza envio como **qualquer caixa
do tenant**. A `ApplicationAccessPolicy` é o que fecha isso, e precisa existir
**antes** do consentimento administrativo.

**Armadilha 1 — a policy não aceita caixa compartilhada como escopo.** A conta
do Entra de uma caixa compartilhada é desabilitada por definição, e o Exchange
recusa conta desabilitada como entidade de segurança. O escopo tem que ser um
**grupo de segurança habilitado para e-mail** contendo a caixa.

**Armadilha 2 — o `Test-ApplicationAccessPolicy` mente.** Ele contorna o cache
por design: responde "Concedido" enquanto o envio real ainda devolve 403. Não
serve como prova de que funciona. A única prova é um envio de verdade.

**Armadilha 3, a mais cara — mudança de permissão leva de 30 minutos a 2 horas,
e cada tentativa renova o relógio.** A documentação é explícita: o cache de um
app **sem chamadas** expira em 30 minutos; o de um app **ativo** é mantido por
até 2 horas. Um monitor testando de minuto em minuto mantém o bloqueio vivo
indefinidamente.

> **A regra que faltava:** faça **uma** mudança, pare de chamar a API, e só
> teste depois de 60 minutos. Encadear mudanças em janelas menores que a
> propagação torna impossível saber qual causou o quê. Foi assim que um ajuste
> de dez minutos virou uma tarde inteira e uma indisponibilidade de três horas.

### Comandos que valem guardar

Conectar ao Exchange Online **sem login interativo**, reaproveitando a sessão
do Azure CLI:

```bash
TOKEN=$(az account get-access-token --resource "https://outlook.office365.com" \
  --query accessToken -o tsv) pwsh -NoProfile -Command '
Import-Module ExchangeOnlineManagement
Connect-ExchangeOnline -AccessToken $env:TOKEN -Organization "alvesmaia.com" -ShowBanner:$false
# comandos aqui
Disconnect-ExchangeOnline -Confirm:$false | Out-Null
'
```

Gerar o client secret **sem que ele passe pelo terminal**:

```bash
SEG=$(az ad app credential reset --id <appId> --display-name "swa-alvesmaia-site" \
  --years 2 --query password -o tsv)
az staticwebapp appsettings set -n swa-alvesmaia-site -g rg-alvesmaia-site \
  --setting-names "GRAPH_CLIENT_SECRET=$SEG"
unset SEG
```

O endpoint de `appsettings` corta a conexão com frequência. **Repita até
confirmar** — se o `set` falhar depois do `unset`, o segredo se perde e é
preciso gerar outro.

### Domínio

Os registros vão na **Cloudflare**, que é a autoridade de DNS; o Azure só
aceita o hostname e emite o certificado. Nenhum dos dois substitui o outro.

| Nome | Tipo | Conteúdo | Proxy |
|---|---|---|---|
| `@` | TXT | token de validação do Azure | Somente DNS |
| `@` | CNAME | `<swa>.azurestaticapps.net` | Somente DNS |
| `www` | CNAME | `<swa>.azurestaticapps.net` | Somente DNS |

**Proxy desligado** — a nuvem laranja quebra a validação do certificado. E o
TXT de validação entra **ao lado** do SPF, nunca no lugar: substituir aquele
registro derruba o e-mail do domínio.

Ordem: para o apex, registrar no Azure primeiro (ele devolve o token) e criar
o TXT depois. Para o `www`, o inverso — o CNAME precisa existir antes, senão
o Azure recusa com "CNAME Record is invalid".

### Verificação de regressão do e-mail

Antes e depois de mexer no domínio, fotografar e comparar. Três adições são
esperadas (TXT de validação e os dois CNAME); **qualquer remoção ou alteração
em MX, SPF, DMARC ou DKIM é motivo para reverter.**

```bash
for q in "MX alvesmaia.com" "TXT alvesmaia.com" "TXT _dmarc.alvesmaia.com" \
         "CNAME selector1._domainkey.alvesmaia.com" \
         "CNAME selector2._domainkey.alvesmaia.com"; do
  set -- $q; echo "--- $1 $2"; nslookup -type=$1 $2 1.1.1.1
done
```

### Operação

```bash
node docs/deploy/leads-nao-entregues.js   # contatos gravados que não foram enviados
pwsh -File docs/deploy/ver-politicas.ps1  # o que restringe o Mail.Send hoje
```

A primeira existe porque o handler grava antes de enviar: se o Graph falhar, o
contato fica na tabela com `enviado:false` e **nada avisa**. A segunda porque a
Application Access Policy não aparece em interface nenhuma — nem no portal do
Azure, nem no Entra, nem no centro de administração do Exchange.

### Pendências que sobraram

- O client secret vence em **11/09/2028**. Quando expirar, o formulário para de
  enviar sem aviso nenhum.
- Não há expurgo de contatos antigos. Decisão registrada do controlador: os
  dados são usados só para responder, e ficam.
- As páginas de Privacidade e Termos têm sete lacunas jurídicas marcadas —
  razão social, CNPJ e foro.

---

## Notas para o executor

**Sobre a estrutura do site:** é **uma página só** (`public/index.html`), desde
o redesenho v2. A nota anterior falava em quatro arquivos HTML com cabeçalho e
rodapé duplicados — não vale mais. As únicas outras páginas são
`privacidade.html` e `termos.html`, documentos legais independentes.

**Sobre o JavaScript:** o site tem JavaScript próprio (`public/js/app.js`), e a
nota anterior dizia que não. Ele cuida do tema, do carrossel, do menu e do
envio do formulário sem recarregar. Tudo é **progressive enhancement**: sem
JavaScript o formulário continua funcionando por POST nativo e `:target`. Ao
mexer, preservar esse caminho.

**Sobre CommonJS na pasta `api/`:** o `package.json` da raiz é
`"type": "module"`, mas o `api/tsconfig.json` compila para CommonJS. Não é
inconsistência — é o que o runtime do Azure Functions v4 espera. Não "corrigir".

**Sobre o client secret:** se aparecer em qualquer arquivo commitado, é
incidente de segurança — revogar no Entra imediatamente e gerar outro.

**Sobre o `staticwebapp.config.json`:** ele vive em `public/`, não na raiz. O
Azure o procura dentro do `app_location`; na raiz ele é silenciosamente
ignorado e nenhum header de segurança chega a produção.
