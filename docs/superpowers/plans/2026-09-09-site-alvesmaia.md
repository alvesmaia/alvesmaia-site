# Site Institucional Alvesmaia — Plano de Implementação

> **Para executores agênticos:** SUB-SKILL OBRIGATÓRIA: use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para implementar tarefa a tarefa. Os passos usam checkbox (`- [ ]`) para acompanhamento.

**Objetivo:** Publicar um site institucional de 4 páginas para a Alvesmaia em `alvesmaia.com`, com formulário de contato que entrega e-mail de verdade.

**Arquitetura:** HTML/CSS estático servido pelo Cloudflare Pages, sem build step e sem JavaScript. O formulário faz `POST` clássico para uma Pages Function em TypeScript, que valida os dados, confere o Cloudflare Turnstile e envia o e-mail pela API da Resend usando um subdomínio de envio isolado.

**Stack:** HTML5, CSS puro (custom properties), TypeScript (Cloudflare Pages Functions), Vitest (só desenvolvimento), Resend, Cloudflare Turnstile.

**Spec:** `docs/superpowers/specs/2026-09-09-site-alvesmaia-design.md`

## Restrições Globais

- **Zero JavaScript no site publicado.** Menu mobile em CSS puro (checkbox + `:checked`). O formulário funciona com JS desabilitado.
- **Zero build step na publicação.** A Cloudflare serve `public/` direto. Vitest é dependência de desenvolvimento apenas.
- **Idioma:** todo o conteúdo visível em português do Brasil, com acentuação correta.
- **Contraste:** o ciano da marca `#00A8E8` reprova sobre branco (2,70:1). Para texto e links usar `--am-ciano-700` (`#0077AB`). Ciano puro só em elementos gráficos.
- **Nunca simular equipe.** O texto fala em primeira pessoa. Proibido "nossa equipe", "nossos especialistas", "somos uma empresa que".
- **Segredos nunca no repositório.** `RESEND_API_KEY` e `TURNSTILE_SECRET_KEY` só como variáveis de ambiente no Cloudflare Pages.
- **Não tocar em registros de e-mail.** MX, SPF, DKIM e DMARC de `alvesmaia.com` estão em produção e não podem ser alterados.

---

## Estrutura de arquivos

```
alvesmaia-site/
├── functions/
│   └── api/
│       └── contato.ts          Pages Function: recebe POST do formulário
├── src/
│   └── validacao.ts            Lógica pura de validação (testável isoladamente)
├── tests/
│   └── validacao.test.ts       Testes da validação
│   └── contato.test.ts         Testes do handler com fetch mockado
├── public/                     Diretório publicado pela Cloudflare
│   ├── index.html
│   ├── servicos.html
│   ├── sobre.html
│   ├── contato.html
│   ├── css/
│   │   ├── tokens.css          Copiado de branding/brand/tokens.css
│   │   └── site.css            Layout, componentes, tema
│   └── img/
│       ├── logo-horizontal.svg
│       ├── logo-horizontal-escuro.svg
│       ├── simbolo.svg
│       └── favicon/            Conjunto completo de ícones
├── docs/superpowers/
├── package.json                Só devDependencies
└── .gitignore
```

**Responsabilidade de cada arquivo:**

| Arquivo | Responsabilidade única |
|---|---|
| `src/validacao.ts` | Decidir se os dados do formulário são válidos. Sem I/O, sem rede. |
| `functions/api/contato.ts` | Orquestrar: validar → Turnstile → Resend → redirecionar. |
| `public/css/tokens.css` | Valores da marca. Não contém layout. |
| `public/css/site.css` | Layout e componentes. Consome tokens, não define cores cruas. |

---

## Task 1: Fundação e página Início

**Files:**
- Create: `.gitignore` (já existe, verificar)
- Create: `public/css/tokens.css` (copiar de `C:/PROJETOS/branding/brand/tokens.css`)
- Create: `public/css/site.css`
- Create: `public/img/` (copiar SVGs e favicons de `C:/PROJETOS/branding/brand/`)
- Create: `public/index.html`

**Interfaces:**
- Consome: assets de `C:/PROJETOS/branding/brand/`
- Produz: as classes CSS `.cabecalho`, `.rodape`, `.container`, `.botao`, `.botao-primario`, `.cartao`, e o padrão de menu mobile via `#menu-toggle` — todas as páginas seguintes reutilizam

- [ ] **Passo 1: Copiar os assets de marca**

```bash
cd C:/PROJETOS/alvesmaia-site
mkdir -p public/css public/img/favicon

cp C:/PROJETOS/branding/brand/tokens.css public/css/tokens.css
cp C:/PROJETOS/branding/brand/logo/alvesmaia-horizontal.svg public/img/logo-horizontal.svg
cp C:/PROJETOS/branding/brand/logo/alvesmaia-horizontal-escuro.svg public/img/logo-horizontal-escuro.svg
cp C:/PROJETOS/branding/brand/logo/alvesmaia-simbolo.svg public/img/simbolo.svg
cp C:/PROJETOS/branding/brand/favicon/favicon.svg public/img/favicon/favicon.svg
cp C:/PROJETOS/branding/brand/favicon/favicon-32.png public/img/favicon/favicon-32.png
cp C:/PROJETOS/branding/brand/favicon/apple-touch-icon-180.png public/img/favicon/apple-touch-icon-180.png
```

- [ ] **Passo 2: Verificar que os arquivos chegaram**

```bash
ls -la public/css/ public/img/ public/img/favicon/
```

Esperado: `tokens.css`, 3 SVGs de logo, 3 arquivos de favicon.

- [ ] **Passo 3: Acrescentar os tokens de tema escuro ao `tokens.css`**

O `tokens.css` original só tem valores claros. Acrescentar ao final do arquivo:

```css

/* ---- Tema: superfícies semânticas ---- */
:root{
  --am-fundo:#FFFFFF;
  --am-fundo-alt:var(--am-neutro-50);
  --am-superficie:#FFFFFF;
  --am-texto:var(--am-neutro-900);
  --am-texto-suave:var(--am-neutro-600);
  --am-borda:var(--am-neutro-200);
  --am-link:var(--am-ciano-700);
  --am-cabecalho-fundo:var(--am-navy-800);
  --am-cabecalho-texto:#FFFFFF;
}

@media (prefers-color-scheme: dark){
  :root{
    --am-fundo:#08131F;
    --am-fundo-alt:#0E2233;
    --am-superficie:#0E2233;
    --am-texto:#E6EFF6;
    --am-texto-suave:#9BB1C3;
    --am-borda:#1B3346;
    --am-link:#4FC9F8;
    --am-cabecalho-fundo:#08131F;
    --am-cabecalho-texto:#FFFFFF;
  }
}
```

- [ ] **Passo 4: Criar `public/css/site.css`**

```css
/* Reset mínimo */
*,*::before,*::after{box-sizing:border-box}
body,h1,h2,h3,p,ul,figure{margin:0}
ul{padding:0;list-style:none}
img,svg{max-width:100%;display:block}

body{
  font-family:var(--am-fonte);
  background:var(--am-fundo);
  color:var(--am-texto);
  line-height:1.65;
  -webkit-font-smoothing:antialiased;
}

.container{max-width:1080px;margin:0 auto;padding:0 24px}

/* ---------- Cabeçalho ---------- */
.cabecalho{background:var(--am-cabecalho-fundo);color:var(--am-cabecalho-texto)}
.cabecalho .container{display:flex;align-items:center;justify-content:space-between;gap:24px;min-height:76px}
.cabecalho__logo img{height:34px;width:auto}
.cabecalho__nav ul{display:flex;gap:28px}
.cabecalho__nav a{
  color:var(--am-cabecalho-texto);text-decoration:none;font-size:15px;
  padding:6px 0;border-bottom:2px solid transparent;
}
.cabecalho__nav a:hover{border-bottom-color:var(--am-ciano)}
.cabecalho__nav a[aria-current="page"]{border-bottom-color:var(--am-ciano);font-weight:600}

/* Menu mobile em CSS puro — sem JavaScript */
#menu-toggle{position:absolute;opacity:0;pointer-events:none}
.cabecalho__hamburguer{display:none;cursor:pointer;padding:8px;line-height:0}
.cabecalho__hamburguer span{
  display:block;width:24px;height:2px;background:var(--am-cabecalho-texto);margin:5px 0;
}

@media (max-width:760px){
  .cabecalho__hamburguer{display:block}
  .cabecalho__nav{
    display:none;width:100%;order:3;
    border-top:1px solid rgba(255,255,255,.15);
  }
  .cabecalho__nav ul{flex-direction:column;gap:0;padding:8px 0}
  .cabecalho__nav a{display:block;padding:12px 0;border-bottom:none}
  #menu-toggle:checked ~ .cabecalho__nav{display:block}
  .cabecalho .container{flex-wrap:wrap}
}

/* ---------- Tipografia ---------- */
h1{font-size:clamp(30px,5vw,46px);line-height:1.12;font-weight:900;letter-spacing:-.02em;text-wrap:balance}
h2{font-size:clamp(23px,3vw,30px);line-height:1.2;font-weight:800;letter-spacing:-.015em;margin-bottom:12px}
h3{font-size:19px;font-weight:700;margin-bottom:8px}
p{max-width:68ch;color:var(--am-texto-suave)}
a{color:var(--am-link)}

/* ---------- Seções ---------- */
.secao{padding:72px 0}
.secao--alt{background:var(--am-fundo-alt)}
.secao__intro{max-width:68ch;margin-bottom:36px}

/* ---------- Hero ---------- */
.hero{background:var(--am-cabecalho-fundo);color:#fff;padding:88px 0}
.hero h1{color:#fff}
.hero p{color:#9CBBD2;font-size:19px;margin-top:18px}
.hero__acoes{margin-top:32px;display:flex;gap:14px;flex-wrap:wrap}

/* ---------- Botões ---------- */
.botao{
  display:inline-block;padding:13px 26px;border-radius:3px;
  text-decoration:none;font-weight:700;font-size:15.5px;border:2px solid transparent;
}
.botao-primario{background:var(--am-ciano);color:var(--am-navy-900)}
.botao-primario:hover{background:#33BCEE}
.botao-secundario{border-color:rgba(255,255,255,.4);color:#fff}
.botao-secundario:hover{border-color:#fff}

/* ---------- Cartões ---------- */
.grade{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px}
.cartao{
  background:var(--am-superficie);border:1px solid var(--am-borda);
  padding:26px;border-left:3px solid var(--am-ciano);
}
.cartao p{font-size:14.5px;margin-top:6px}

/* ---------- Rodapé ---------- */
.rodape{background:var(--am-cabecalho-fundo);color:#9CBBD2;padding:44px 0;margin-top:0}
.rodape .container{display:flex;justify-content:space-between;gap:32px;flex-wrap:wrap;align-items:flex-start}
.rodape img{height:38px;width:auto}
.rodape a{color:#CFE3F0}
.rodape__legal{font-size:13px;width:100%;border-top:1px solid rgba(255,255,255,.12);padding-top:20px;margin-top:8px}

/* ---------- Formulário ---------- */
.form{max-width:560px;display:flex;flex-direction:column;gap:18px;margin-top:8px}
.campo{display:flex;flex-direction:column;gap:6px}
.campo label{font-size:14px;font-weight:600;color:var(--am-texto)}
.campo input,.campo select,.campo textarea{
  font-family:inherit;font-size:15.5px;padding:11px 13px;
  border:1px solid var(--am-borda);border-radius:3px;
  background:var(--am-superficie);color:var(--am-texto);
}
.campo textarea{min-height:150px;resize:vertical}
.campo input:focus-visible,.campo select:focus-visible,.campo textarea:focus-visible{
  outline:2px solid var(--am-ciano-700);outline-offset:1px;border-color:transparent;
}
.form button{
  align-self:flex-start;cursor:pointer;font-family:inherit;
  padding:13px 30px;border:0;border-radius:3px;
  background:var(--am-ciano-700);color:#fff;font-weight:700;font-size:15.5px;
}
.form button:hover{background:var(--am-ciano-600)}

/* ---------- Avisos de estado ---------- */
.aviso{padding:14px 18px;border-left:3px solid;margin-bottom:24px;max-width:560px}
.aviso p{margin:0;color:var(--am-texto);font-size:14.5px}
.aviso--ok{border-color:var(--am-semantica-sucesso);background:#E8F5EF}
.aviso--erro{border-color:var(--am-semantica-erro);background:#FBEDEB}
@media (prefers-color-scheme:dark){
  .aviso--ok{background:#0D2A20}
  .aviso--erro{background:#2B1512}
}

/* ---------- Acessibilidade ---------- */
.pular-para-conteudo{
  position:absolute;left:-9999px;top:0;background:var(--am-ciano);
  color:var(--am-navy-900);padding:12px 20px;z-index:100;font-weight:700;
}
.pular-para-conteudo:focus{left:0}
```

- [ ] **Passo 5: Criar `public/index.html`**

O cabeçalho e o rodapé deste arquivo são o **molde** para as outras 3 páginas. Ao copiar para as próximas, mudar apenas o `aria-current="page"`.

```html
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Alvesmaia — Soluções sob medida para a sua empresa</title>
<meta name="description" content="Automação, integração de sistemas e desenvolvimento sob medida para pequenas e médias empresas.">
<link rel="icon" href="/img/favicon/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/img/favicon/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/img/favicon/apple-touch-icon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;900&display=swap">
<link rel="stylesheet" href="/css/tokens.css">
<link rel="stylesheet" href="/css/site.css">
</head>
<body>

<a class="pular-para-conteudo" href="#conteudo">Pular para o conteúdo</a>

<header class="cabecalho">
  <div class="container">
    <a class="cabecalho__logo" href="/" aria-label="Alvesmaia, página inicial">
      <img src="/img/logo-horizontal-escuro.svg" alt="Alvesmaia">
    </a>
    <input type="checkbox" id="menu-toggle" aria-label="Abrir menu de navegação">
    <label class="cabecalho__hamburguer" for="menu-toggle" aria-hidden="true">
      <span></span><span></span><span></span>
    </label>
    <nav class="cabecalho__nav" aria-label="Principal">
      <ul>
        <li><a href="/" aria-current="page">Início</a></li>
        <li><a href="/servicos.html">Serviços</a></li>
        <li><a href="/sobre.html">Sobre</a></li>
        <li><a href="/contato.html">Contato</a></li>
      </ul>
    </nav>
  </div>
</header>

<main id="conteudo">

  <section class="hero">
    <div class="container">
      <h1>Soluções sob medida para a sua empresa</h1>
      <p>Automação, integração e desenvolvimento para pequenas e médias empresas que precisam de tecnologia funcionando — não de mais um sistema para gerenciar.</p>
      <div class="hero__acoes">
        <a class="botao botao-primario" href="/contato.html">Falar sobre seu projeto</a>
        <a class="botao botao-secundario" href="/servicos.html">Ver serviços</a>
      </div>
    </div>
  </section>

  <section class="secao">
    <div class="container">
      <div class="secao__intro">
        <h2>O que eu faço</h2>
        <p>Quatro frentes, todas com o mesmo objetivo: tirar trabalho repetitivo do caminho das pessoas.</p>
      </div>
      <div class="grade">
        <article class="cartao">
          <h3>RPA</h3>
          <p>Tarefas repetitivas que hoje consomem horas da sua equipe passam a rodar sozinhas.</p>
        </article>
        <article class="cartao">
          <h3>Integrações</h3>
          <p>Sistemas que não conversam entre si começam a trocar dados automaticamente.</p>
        </article>
        <article class="cartao">
          <h3>Aplicações web</h3>
          <p>Software sob medida quando o pronto de prateleira não resolve.</p>
        </article>
        <article class="cartao">
          <h3>Power Platform</h3>
          <p>Automação e aplicativos dentro do Microsoft 365 que sua empresa já paga.</p>
        </article>
      </div>
    </div>
  </section>

  <section class="secao secao--alt">
    <div class="container">
      <h2>Você fala com quem resolve</h2>
      <p>A Alvesmaia é operada por uma pessoa só, e isso é intencional. Quem entende o seu problema é quem escreve o código — nada se perde entre o que você pediu e o que foi entregue.</p>
      <p style="margin-top:24px"><a class="botao botao-primario" href="/contato.html">Começar uma conversa</a></p>
    </div>
  </section>

</main>

<footer class="rodape">
  <div class="container">
    <div>
      <img src="/img/simbolo.svg" alt="">
      <p style="color:#9CBBD2;margin-top:14px;font-size:14px">Soluções sob medida para a sua empresa</p>
    </div>
    <div>
      <p style="color:#CFE3F0;font-weight:700;margin-bottom:6px">Contato</p>
      <p style="font-size:14px"><a href="mailto:contato@alvesmaia.com">contato@alvesmaia.com</a></p>
    </div>
    <div class="rodape__legal">
      Alvesmaia · Consultoria de TI
    </div>
  </div>
</footer>

</body>
</html>
```

- [ ] **Passo 6: Abrir no navegador e conferir**

```bash
cd C:/PROJETOS/alvesmaia-site/public && python -m http.server 8080
```

Se `python` não estiver disponível, usar `npx serve public` ou abrir o arquivo direto.

Conferir: logo aparece, menu funciona ao estreitar a janela abaixo de 760px, hero legível, 4 cartões alinhados, rodapé com símbolo.

- [ ] **Passo 7: Commit**

```bash
cd C:/PROJETOS/alvesmaia-site
git add public/ .gitignore
git commit -m "feat: fundacao do site e pagina inicial

Estrutura publica, tokens de marca com tema claro/escuro, CSS de layout
e pagina inicial. Menu mobile em CSS puro, sem JavaScript.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QssWCvHSMwSCEjdqbHeMPd"
```

---

## Task 2: Páginas Serviços e Sobre

**Files:**
- Create: `public/servicos.html`
- Create: `public/sobre.html`

**Interfaces:**
- Consome: classes CSS e o molde de cabeçalho/rodapé da Task 1
- Produz: nada consumido por tarefas seguintes

- [ ] **Passo 1: Criar `public/servicos.html`**

Copiar `index.html` inteiro, trocar `<title>`, `<meta name="description">`, mover `aria-current="page"` para o link de Serviços, e substituir todo o `<main>` por:

```html
<main id="conteudo">
  <section class="secao">
    <div class="container">
      <div class="secao__intro">
        <h1>Serviços</h1>
        <p style="margin-top:16px">Cada projeto começa entendendo o processo antes da tecnologia. Se a solução certa for não construir nada, eu digo isso.</p>
      </div>
    </div>
  </section>

  <section class="secao secao--alt">
    <div class="container">
      <h2>RPA — Automação de processos</h2>
      <p>Robôs de software que executam tarefas repetitivas do jeito que uma pessoa executaria: abrindo sistemas, preenchendo formulários, conferindo planilhas, movendo arquivos entre pastas e sistemas.</p>
      <p style="margin-top:14px"><strong style="color:var(--am-texto)">Quando faz sentido:</strong> existe um processo bem definido que alguém repete várias vezes por semana, e alterar o sistema de origem não é viável ou não compensa.</p>
    </div>
  </section>

  <section class="secao">
    <div class="container">
      <h2>Integrações</h2>
      <p>Conexão entre sistemas que não foram feitos para conversar — ERP com e-commerce, planilha com banco de dados, sistema legado com serviço em nuvem.</p>
      <p style="margin-top:14px"><strong style="color:var(--am-texto)">Quando faz sentido:</strong> a mesma informação é digitada em dois lugares, ou alguém exporta de um sistema para importar em outro.</p>
    </div>
  </section>

  <section class="secao secao--alt">
    <div class="container">
      <h2>Aplicações web</h2>
      <p>Desenvolvimento de sistemas próprios, do zero, quando nenhuma solução de mercado atende ao processo da empresa.</p>
      <p style="margin-top:14px"><strong style="color:var(--am-texto)">Quando faz sentido:</strong> o processo é a vantagem competitiva do negócio, e forçá-lo a caber num software genérico custa mais do que construir o certo.</p>
    </div>
  </section>

  <section class="secao">
    <div class="container">
      <h2>Power Platform</h2>
      <p>Automação e aplicativos construídos dentro do Microsoft 365 — Power Automate, Power Apps, SharePoint — aproveitando as licenças que a empresa já paga.</p>
      <p style="margin-top:14px"><strong style="color:var(--am-texto)">Quando faz sentido:</strong> a empresa já usa Microsoft 365 e o processo pode ser resolvido sem contratar software adicional.</p>
    </div>
  </section>

  <section class="secao secao--alt">
    <div class="container">
      <h2>Não sabe qual se aplica?</h2>
      <p>Me descreva o processo que está incomodando. Costuma ficar claro em uma conversa.</p>
      <p style="margin-top:24px"><a class="botao botao-primario" href="/contato.html">Descrever meu caso</a></p>
    </div>
  </section>
</main>
```

`<title>`: `Serviços — Alvesmaia`
`<meta name="description">`: `RPA, integrações, aplicações web e Power Platform para pequenas e médias empresas.`

- [ ] **Passo 2: Criar `public/sobre.html`**

Mesmo molde, `aria-current="page"` no link Sobre, e `<main>`:

```html
<main id="conteudo">
  <section class="secao">
    <div class="container">
      <div class="secao__intro">
        <h1>Sobre</h1>
      </div>
      <p style="font-size:18px">Meu nome é Uemerson Maia. Sou desenvolvedor e trabalho com automação e integração de sistemas.</p>
      <p style="margin-top:18px">A Alvesmaia é a empresa pela qual eu atendo — e sou eu quem atende. Não há camada de atendimento, não há transferência de chamado, não há equipe genérica de especialistas. Você fala com quem escreve o código.</p>
      <p style="margin-top:18px">Isso tem uma vantagem e um limite, e prefiro ser claro sobre os dois.</p>
    </div>
  </section>

  <section class="secao secao--alt">
    <div class="container">
      <h2>A vantagem</h2>
      <p>A conversa é direta. Quem entende o problema é a mesma pessoa que constrói a solução — nada se perde no caminho entre o que você pediu e o que foi feito. Sem telefone sem fio, sem escopo que muda de sentido ao passar de mão em mão.</p>
    </div>
  </section>

  <section class="secao">
    <div class="container">
      <h2>O limite</h2>
      <p>Eu não sou uma consultoria de vinte pessoas. Se o seu projeto exige uma equipe grande trabalhando em paralelo, com prazo curto, provavelmente não sou a escolha certa — e vou te dizer isso antes de você perder tempo.</p>
    </div>
  </section>

  <section class="secao secao--alt">
    <div class="container">
      <h2>Como eu trabalho</h2>
      <p>Atendo pequenas e médias empresas. Começo entendendo o processo, não a tecnologia. Meu trabalho dá certo quando a tecnologia some do caminho e o processo simplesmente funciona.</p>
      <p style="margin-top:24px"><a class="botao botao-primario" href="/contato.html">Falar comigo</a></p>
    </div>
  </section>
</main>
```

`<title>`: `Sobre — Alvesmaia`
`<meta name="description">`: `Quem está por trás da Alvesmaia, como eu trabalho, e o que eu não faço.`

- [ ] **Passo 3: Conferir a navegação**

Abrir as 3 páginas no servidor local. Verificar que o link da página atual está destacado em cada uma, e que o menu mobile abre nas três.

- [ ] **Passo 4: Commit**

```bash
git add public/servicos.html public/sobre.html
git commit -m "feat: paginas de servicos e sobre

Quatro servicos com o angulo do problema que resolvem. Pagina Sobre em
primeira pessoa, declarando explicitamente o limite de ser uma operacao
individual.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QssWCvHSMwSCEjdqbHeMPd"
```

---

## Task 3: Página de Contato com formulário

**Files:**
- Create: `public/contato.html`

**Interfaces:**
- Produz: o formulário que faz `POST /api/contato` com os campos `nome`, `email`, `assunto`, `mensagem`, `cf-turnstile-response`. A Function da Task 5 depende exatamente desses nomes.
- Produz: os estados de query string `?estado=ok`, `?estado=erro`, `?estado=robo` que a Function usa ao redirecionar.

**Nota:** os avisos de sucesso/erro aparecem via CSS a partir da query string, sem JavaScript. A técnica: os três avisos existem no HTML, ficam ocultos por padrão, e o CSS `:target` não serve aqui — então usamos uma solução server-side simples. Como não há server-side rendering, o caminho sem JS é o formulário apontar para âncoras diferentes. **Decisão:** a Function redireciona para `/contato.html#enviado`, `#erro` ou `#robo`, e o CSS usa `:target` para revelar o aviso correspondente.

- [ ] **Passo 1: Acrescentar o CSS dos avisos por `:target` ao `site.css`**

```css
/* Avisos revelados por âncora — funciona sem JavaScript */
.aviso[id]{display:none}
.aviso[id]:target{display:block}
```

- [ ] **Passo 2: Criar `public/contato.html`**

Mesmo molde de cabeçalho/rodapé, `aria-current="page"` em Contato, e `<main>`:

```html
<main id="conteudo">
  <section class="secao">
    <div class="container">
      <div class="secao__intro">
        <h1>Contato</h1>
        <p style="margin-top:16px">Me conte o que você precisa resolver. Respondo em até um dia útil.</p>
      </div>

      <div class="aviso aviso--ok" id="enviado" role="status">
        <p><strong>Mensagem enviada.</strong> Recebi seu contato e respondo em até um dia útil.</p>
      </div>

      <div class="aviso aviso--erro" id="erro" role="alert">
        <p><strong>Não consegui enviar.</strong> Tente de novo em alguns instantes, ou escreva direto para <a href="mailto:contato@alvesmaia.com">contato@alvesmaia.com</a>.</p>
      </div>

      <div class="aviso aviso--erro" id="robo" role="alert">
        <p><strong>Verificação não concluída.</strong> Marque a caixa de verificação antes de enviar.</p>
      </div>

      <form class="form" method="POST" action="/api/contato">
        <div class="campo">
          <label for="nome">Nome</label>
          <input type="text" id="nome" name="nome" required minlength="2" autocomplete="name">
        </div>

        <div class="campo">
          <label for="email">E-mail</label>
          <input type="email" id="email" name="email" required autocomplete="email">
        </div>

        <div class="campo">
          <label for="assunto">Assunto</label>
          <select id="assunto" name="assunto" required>
            <option value="Orçamento">Orçamento</option>
            <option value="Dúvida técnica">Dúvida técnica</option>
            <option value="Suporte">Suporte</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        <div class="campo">
          <label for="mensagem">Mensagem</label>
          <textarea id="mensagem" name="mensagem" required minlength="10" maxlength="5000"></textarea>
        </div>

        <div class="cf-turnstile" data-sitekey="COLAR_SITE_KEY_AQUI"></div>

        <button type="submit">Enviar mensagem</button>
      </form>
    </div>
  </section>

  <section class="secao secao--alt">
    <div class="container">
      <h2>Ou escreva direto</h2>
      <p>Se preferir usar seu próprio e-mail:</p>
      <ul style="margin-top:16px;display:flex;flex-direction:column;gap:8px">
        <li><a href="mailto:contato@alvesmaia.com">contato@alvesmaia.com</a> — assuntos gerais</li>
        <li><a href="mailto:suporte@alvesmaia.com">suporte@alvesmaia.com</a> — clientes com contrato</li>
        <li><a href="mailto:financeiro@alvesmaia.com">financeiro@alvesmaia.com</a> — notas e pagamentos</li>
      </ul>
    </div>
  </section>
</main>
```

Antes do `</body>`, acrescentar o script do Turnstile — **é o único JavaScript da página, e é externo, do widget da Cloudflare**:

```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
```

`<title>`: `Contato — Alvesmaia`
`<meta name="description">`: `Fale sobre seu projeto de automação, integração ou desenvolvimento.`

- [ ] **Passo 3: Conferir os três estados manualmente**

Abrir no navegador local:
- `/contato.html` — nenhum aviso visível
- `/contato.html#enviado` — aviso verde de sucesso
- `/contato.html#erro` — aviso vermelho
- `/contato.html#robo` — aviso vermelho de verificação

- [ ] **Passo 4: Commit**

```bash
git add public/contato.html public/css/site.css
git commit -m "feat: pagina de contato com formulario

Formulario HTML classico (POST, sem fetch). Avisos de estado revelados
por :target, funcionando sem JavaScript proprio. Site key do Turnstile
ainda placeholder — preenchida na Task 6.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QssWCvHSMwSCEjdqbHeMPd"
```

---

## Task 4: Lógica de validação (TDD)

**Files:**
- Create: `package.json`
- Create: `src/validacao.ts`
- Test: `tests/validacao.test.ts`

**Interfaces:**
- Produz: `interface DadosContato { nome: string; email: string; assunto: string; mensagem: string }`
- Produz: `function validarFormulario(d: DadosContato): string[]` — retorna array vazio quando válido, ou lista de códigos de erro (`"nome"`, `"email"`, `"mensagem_curta"`, `"mensagem_longa"`). A Task 5 consome exatamente esta assinatura.

- [ ] **Passo 1: Criar `package.json`**

```json
{
  "name": "alvesmaia-site",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^2.1.8",
    "typescript": "^5.7.2",
    "@cloudflare/workers-types": "^4.20241218.0"
  }
}
```

- [ ] **Passo 2: Instalar**

```bash
cd C:/PROJETOS/alvesmaia-site && npm install
```

- [ ] **Passo 3: Escrever o teste que falha**

Criar `tests/validacao.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { validarFormulario } from "../src/validacao";

const valido = {
  nome: "Maria Silva",
  email: "maria@empresa.com.br",
  assunto: "Orçamento",
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
    const erros = validarFormulario({ nome: "", email: "x", assunto: "", mensagem: "" });
    expect(erros).toContain("nome");
    expect(erros).toContain("email");
    expect(erros).toContain("mensagem_curta");
  });
});
```

- [ ] **Passo 4: Rodar e confirmar que falha**

```bash
npm test
```

Esperado: FALHA com erro de módulo não encontrado (`../src/validacao`).

- [ ] **Passo 5: Implementar o mínimo para passar**

Criar `src/validacao.ts`:

```typescript
export interface DadosContato {
  nome: string;
  email: string;
  assunto: string;
  mensagem: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validarFormulario(d: DadosContato): string[] {
  const erros: string[] = [];

  if (d.nome.trim().length < 2) erros.push("nome");
  if (!EMAIL_RE.test(d.email.trim())) erros.push("email");

  const msg = d.mensagem.trim();
  if (msg.length < 10) erros.push("mensagem_curta");
  if (msg.length > 5000) erros.push("mensagem_longa");

  return erros;
}
```

- [ ] **Passo 6: Rodar e confirmar que passa**

```bash
npm test
```

Esperado: 9 testes passando.

- [ ] **Passo 7: Commit**

```bash
git add package.json package-lock.json src/validacao.ts tests/validacao.test.ts
git commit -m "feat: validacao do formulario de contato

Logica pura, sem I/O, testada isoladamente. Acumula todos os erros em vez
de parar no primeiro.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QssWCvHSMwSCEjdqbHeMPd"
```

---

## Task 5: Pages Function `/api/contato`

**Files:**
- Create: `functions/api/contato.ts`
- Test: `tests/contato.test.ts`

**Interfaces:**
- Consome: `validarFormulario` e `DadosContato` da Task 4
- Consome: nomes de campo do formulário da Task 3
- Produz: respostas HTTP 303 para `/contato.html#enviado`, `#erro`, `#robo`

- [ ] **Passo 1: Escrever os testes que falham**

Criar `tests/contato.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { onRequestPost } from "../functions/api/contato";

const env = { RESEND_API_KEY: "chave-fake", TURNSTILE_SECRET_KEY: "segredo-fake" };

function requisicao(campos: Record<string, string>) {
  const form = new FormData();
  for (const [k, v] of Object.entries(campos)) form.append(k, v);
  return new Request("https://alvesmaia.com/api/contato", { method: "POST", body: form });
}

const camposValidos = {
  nome: "Maria Silva",
  email: "maria@empresa.com.br",
  assunto: "Orçamento",
  mensagem: "Gostaria de automatizar a conferência de notas fiscais.",
  "cf-turnstile-response": "token-valido",
};

beforeEach(() => {
  vi.restoreAllMocks();
});

function mockFetch(turnstileOk: boolean, resendOk = true) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
    const u = String(url);
    if (u.includes("siteverify")) {
      return new Response(JSON.stringify({ success: turnstileOk }), { status: 200 });
    }
    if (u.includes("resend.com")) {
      return new Response("{}", { status: resendOk ? 200 : 500 });
    }
    throw new Error("URL inesperada: " + u);
  });
}

describe("onRequestPost", () => {
  it("redireciona para #enviado quando tudo está correto", async () => {
    mockFetch(true);
    const res = await onRequestPost({ request: requisicao(camposValidos), env } as never);
    expect(res.status).toBe(303);
    expect(res.headers.get("Location")).toBe("/contato.html#enviado");
  });

  it("redireciona para #erro quando a validação falha", async () => {
    mockFetch(true);
    const res = await onRequestPost({
      request: requisicao({ ...camposValidos, email: "invalido" }),
      env,
    } as never);
    expect(res.headers.get("Location")).toBe("/contato.html#erro");
  });

  it("não chama a Resend quando a validação falha", async () => {
    const spy = mockFetch(true);
    await onRequestPost({ request: requisicao({ ...camposValidos, nome: "" }), env } as never);
    const chamadasResend = spy.mock.calls.filter((c) => String(c[0]).includes("resend.com"));
    expect(chamadasResend).toHaveLength(0);
  });

  it("redireciona para #robo quando o Turnstile reprova", async () => {
    mockFetch(false);
    const res = await onRequestPost({ request: requisicao(camposValidos), env } as never);
    expect(res.headers.get("Location")).toBe("/contato.html#robo");
  });

  it("redireciona para #erro quando a Resend falha", async () => {
    mockFetch(true, false);
    const res = await onRequestPost({ request: requisicao(camposValidos), env } as never);
    expect(res.headers.get("Location")).toBe("/contato.html#erro");
  });

  it("envia o e-mail do visitante como reply_to", async () => {
    const spy = mockFetch(true);
    await onRequestPost({ request: requisicao(camposValidos), env } as never);
    const chamada = spy.mock.calls.find((c) => String(c[0]).includes("resend.com"));
    const corpo = JSON.parse(String((chamada![1] as RequestInit).body));
    expect(corpo.reply_to).toBe("maria@empresa.com.br");
    expect(corpo.to).toContain("contato@alvesmaia.com");
  });
});
```

- [ ] **Passo 2: Rodar e confirmar que falha**

```bash
npm test
```

Esperado: FALHA, módulo `../functions/api/contato` não existe.

- [ ] **Passo 3: Implementar a Function**

Criar `functions/api/contato.ts`:

```typescript
import { validarFormulario, type DadosContato } from "../../src/validacao";

interface Env {
  RESEND_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
}

const DESTINO = "contato@alvesmaia.com";
const REMETENTE = "Site Alvesmaia <formulario@mail.alvesmaia.com>";

function redirecionar(ancora: string): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: `/contato.html#${ancora}` },
  });
}

async function turnstileValido(
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
    const r = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: corpo },
    );
    const json = (await r.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    return false;
  }
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function enviarEmail(d: DadosContato, chave: string): Promise<boolean> {
  const corpo = {
    from: REMETENTE,
    to: [DESTINO],
    reply_to: d.email.trim(),
    subject: `[Site] ${d.assunto} — ${d.nome.trim()}`,
    html:
      `<p><strong>Nome:</strong> ${escapar(d.nome.trim())}</p>` +
      `<p><strong>E-mail:</strong> ${escapar(d.email.trim())}</p>` +
      `<p><strong>Assunto:</strong> ${escapar(d.assunto)}</p>` +
      `<hr>` +
      `<p>${escapar(d.mensagem.trim()).replace(/\n/g, "<br>")}</p>`,
  };

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(corpo),
    });
    if (!r.ok) {
      // Visível no log da Cloudflare — sem isso, uma chave expirada some em silêncio
      console.error("Resend recusou o envio:", r.status, await r.text());
    }
    return r.ok;
  } catch (e) {
    console.error("Falha de rede ao chamar a Resend:", e);
    return false;
  }
}

export const onRequestPost = async (contexto: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  const { request, env } = contexto;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return redirecionar("erro");
  }

  const dados: DadosContato = {
    nome: String(form.get("nome") ?? ""),
    email: String(form.get("email") ?? ""),
    assunto: String(form.get("assunto") ?? ""),
    mensagem: String(form.get("mensagem") ?? ""),
  };

  if (validarFormulario(dados).length > 0) return redirecionar("erro");

  const token = String(form.get("cf-turnstile-response") ?? "");
  const ip = request.headers.get("CF-Connecting-IP");
  if (!(await turnstileValido(token, env.TURNSTILE_SECRET_KEY, ip))) {
    return redirecionar("robo");
  }

  const enviado = await enviarEmail(dados, env.RESEND_API_KEY);
  return redirecionar(enviado ? "enviado" : "erro");
};
```

- [ ] **Passo 4: Rodar e confirmar que passa**

```bash
npm test
```

Esperado: 15 testes passando (9 de validação + 6 do handler).

- [ ] **Passo 5: Commit**

```bash
git add functions/ tests/contato.test.ts
git commit -m "feat: function do formulario de contato

Valida, confere Turnstile server-side, envia pela Resend e redireciona
com ancora de estado. E-mail do visitante vai como reply_to para permitir
resposta direta pelo Outlook. Conteudo escapado antes de virar HTML.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QssWCvHSMwSCEjdqbHeMPd"
```

---

## Task 6: Publicação e configuração de serviços

Esta tarefa mistura passos que exigem contas e cartão — o executor **não** deve criar contas nem inserir chaves. Os passos marcados **[USUÁRIO]** são do Uemerson.

**Files:**
- Modify: `public/contato.html` (trocar a site key do Turnstile)

- [ ] **Passo 1: Criar o repositório no GitHub**

```bash
cd C:/PROJETOS/alvesmaia-site
gh repo create alvesmaia-site --public --source=. --remote=origin --description "Site institucional da Alvesmaia"
git push -u origin main
```

- [ ] **Passo 2: [USUÁRIO] Criar conta na Resend e verificar o subdomínio**

1. Criar conta em resend.com (plano gratuito, 3.000 e-mails/mês)
2. Adicionar o domínio **`mail.alvesmaia.com`** — não a raiz
3. A Resend mostra registros de DNS (TXT de DKIM e possivelmente MX de bounce)
4. Adicionar esses registros na Cloudflare, **todos sob `mail.alvesmaia.com`**
5. Gerar uma API key e guardá-la

**Verificação obrigatória antes de seguir:** confirmar que a raiz não foi tocada.

```bash
nslookup -type=MX alvesmaia.com
nslookup -type=TXT alvesmaia.com
```

Esperado: MX ainda apontando para `alvesmaia-com.mail.protection.outlook.com`, e o TXT de SPF do Microsoft 365 intacto.

- [ ] **Passo 3: [USUÁRIO] Criar o widget do Turnstile**

1. Cloudflare → Turnstile → adicionar site
2. Domínio: `alvesmaia.com`
3. Copiar a **site key** (pública) e a **secret key** (privada)

- [ ] **Passo 4: Colar a site key no HTML**

Em `public/contato.html`, trocar `COLAR_SITE_KEY_AQUI` pela site key real. Ela é pública, pode ir para o repositório.

```bash
git add public/contato.html
git commit -m "chore: site key do Turnstile

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QssWCvHSMwSCEjdqbHeMPd"
git push
```

- [ ] **Passo 5: Criar o projeto no Cloudflare Pages**

Cloudflare → Workers & Pages → Create → Pages → conectar ao repositório `alvesmaia/alvesmaia-site`.

Configuração de build:
- Framework preset: **None**
- Build command: **(vazio)**
- Build output directory: **`public`**

- [ ] **Passo 6: [USUÁRIO] Cadastrar os segredos**

No projeto Pages → Settings → Environment variables, como **Secret** (criptografado):

| Nome | Valor |
|---|---|
| `RESEND_API_KEY` | chave gerada no Passo 2 |
| `TURNSTILE_SECRET_KEY` | secret key do Passo 3 |

- [ ] **Passo 7: Apontar o domínio**

Pages → Custom domains → adicionar `alvesmaia.com` e `www.alvesmaia.com`.

- [ ] **Passo 8: Verificação de regressão do e-mail**

Este é o passo mais importante da tarefa.

```bash
nslookup -type=MX alvesmaia.com
nslookup -type=TXT alvesmaia.com
nslookup -type=TXT _dmarc.alvesmaia.com
nslookup -type=CNAME selector1._domainkey.alvesmaia.com
```

Esperado, sem nenhuma alteração:
- MX → `alvesmaia-com.mail.protection.outlook.com`
- TXT → `v=spf1 include:spf.protection.outlook.com ~all`
- `_dmarc` → `v=DMARC1; p=none; rua=mailto:...@dmarc-reports.cloudflare.net`
- `selector1._domainkey` → `...dkim.mail.microsoft`

Se qualquer um desses tiver mudado, **parar e reverter o domínio customizado** antes de continuar.

- [ ] **Passo 9: Checklist de verificação manual**

Executar o checklist da spec, seção "Verificação":

1. As 4 páginas renderizam em desktop e mobile
2. Navegação funciona nas duas larguras
3. Tema claro e escuro conferidos
4. Formulário enviado de verdade → chega em `contato@alvesmaia.com`
5. Responder no Outlook vai para o e-mail do visitante
6. Turnstile aparece e bloqueia envio sem interação
7. Com JavaScript desabilitado: menu abre e formulário envia
8. `alvesmaia.com` e `www.alvesmaia.com` ambos servem o site
9. E-mail intacto (Passo 8 acima)

- [ ] **Passo 10: Commit final**

```bash
git add -A
git commit -m "docs: registro da configuracao de publicacao"
git push
```

---

## Notas para o executor

**Sobre a duplicação de cabeçalho e rodapé:** é intencional, decidida na spec. Ao alterar navegação ou rodapé, alterar nos 4 arquivos. Conferir com:

```bash
grep -c "cabecalho__nav" public/*.html
```

Esperado: `1` em cada um dos 4 arquivos.

**Sobre o JavaScript:** o único `<script>` do site é o widget do Turnstile, carregado da Cloudflare, apenas em `contato.html`. Nenhum JavaScript próprio. Se surgir vontade de adicionar, revisar a spec antes.

**Sobre a chave da Resend:** se aparecer em qualquer arquivo commitado, é incidente de segurança — revogar na Resend imediatamente e gerar outra.
