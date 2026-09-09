# Site institucional Alvesmaia — Design

**Data:** 9 de setembro de 2026
**Status:** Aprovado, pronto para plano de implementação

## Contexto

A Alvesmaia é uma consultoria de TI operada por uma pessoa (Uemerson Maia), voltada a
pequenas e médias empresas. A identidade visual, o domínio e o e-mail corporativo já
estão prontos:

- Marca completa em `C:/PROJETOS/branding/brand/` — logos SVG, favicon, paleta, tokens CSS
- Domínio `alvesmaia.com` na Cloudflare, com DNS gerenciado lá
- E-mail em Microsoft 365 Business Basic, com SPF, DKIM e DMARC configurados
- Alias ativos: `contato@`, `suporte@`, `financeiro@`, `no-reply@`, além do principal
  `uemerson@alvesmaia.com`

Falta a presença web. Este documento descreve o site.

## Objetivo

Um site institucional de 4 páginas que apresente a Alvesmaia, seus serviços e permita
contato — incluindo um formulário que realmente entrega e-mail na caixa existente.

## Escopo

- 4 páginas estáticas em HTML/CSS puro
- Formulário de contato funcional via Cloudflare Pages Function + Resend
- Proteção anti-spam via Cloudflare Turnstile
- Publicação automática via Cloudflare Pages conectado ao GitHub
- Domínio próprio (`alvesmaia.com` e `www.alvesmaia.com`)

## Fora de escopo

Decidido explicitamente com o cliente, não é esquecimento:

- **Blog / artigos** — exige manutenção contínua que não se justifica agora
- **Área do cliente / login** — exigiria banco de dados e autenticação
- **BIMI** — descartado; o Outlook (que o cliente e boa parte das PMEs usam) não renderiza
- **Framework JS (React/Next)** — peso desnecessário para site majoritariamente de conteúdo
- **Gerador estático (Astro)** — avaliado e descartado em favor de menos peças móveis

## Estrutura de páginas

### `index.html` — Início
- Hero com o slogan da marca: "Soluções sob medida para a sua empresa"
- Resumo dos 4 serviços, cada um com link para a seção correspondente em Serviços
- Chamada para contato

### `servicos.html` — Serviços
Quatro blocos. Cada um descreve o problema que resolve, não uma lista de tecnologias:

| Serviço | Ângulo |
|---|---|
| RPA | Automação de tarefas repetitivas que hoje consomem hora de gente |
| Integrações | Sistemas que não conversam entre si passando a trocar dados |
| Aplicações web | Software sob medida quando o pronto de prateleira não serve |
| Power Platform | Automação e apps dentro do Microsoft 365 que a empresa já paga |

### `sobre.html` — Sobre
Aplica a decisão de posicionamento já tomada: a Alvesmaia é a porta de entrada
institucional, Uemerson é a prova. Texto em primeira pessoa. **Não simular equipe** —
nada de "nossa equipe de especialistas".

### `contato.html` — Contato
- Formulário (nome, e-mail, assunto, mensagem)
- E-mails diretos listados para quem preferir escrever sem formulário
- Estado de sucesso/erro após envio

## Base visual

- **Tokens:** reaproveita `brand/tokens.css` (copiado para o repo do site)
- **Tipografia:** Nunito Sans via Google Fonts
- **Logos:** `alvesmaia-horizontal.svg` no cabeçalho, símbolo no rodapé
- **Favicon:** conjunto completo já existente em `brand/favicon/`
- **Tema:** claro e escuro via `prefers-color-scheme`, mesmo padrão do manual da marca
- **JavaScript:** nenhum. O menu mobile usa técnica CSS pura (checkbox oculto + `:checked`),
  então o site inteiro — navegação e formulário — funciona com JavaScript desabilitado

### Regra de cor herdada do manual

O ciano da marca (`#00A8E8`) reprova em contraste sobre branco (2,70:1). Para texto e
links usar `--am-ciano-700` (`#0077AB`, 4,97:1, AA). O ciano puro fica restrito a
elementos gráficos e fundos.

## Arquitetura do formulário

### Fluxo

1. Visitante preenche o formulário em `contato.html`
2. `POST` para `/api/contato` — formulário HTML clássico, sem depender de JavaScript
3. A Pages Function valida no servidor:
   - Campos obrigatórios presentes
   - Formato de e-mail
   - Token do Turnstile válido (verificação server-side contra a API da Cloudflare)
4. Chama a API da Resend para enviar
5. Redireciona de volta com estado de sucesso ou erro

### E-mail enviado

| Campo | Valor |
|---|---|
| `from` | `Site Alvesmaia <formulario@mail.alvesmaia.com>` |
| `to` | `contato@alvesmaia.com` |
| `reply_to` | e-mail informado pelo visitante |
| Assunto | `[Site] <assunto escolhido> — <nome>` |

O `reply_to` é o detalhe que importa no dia a dia: responder no Outlook vai direto para
o visitante, sem copiar endereço na mão.

### Por que um subdomínio para envio

A Resend recomenda enviar por subdomínio para isolar reputação. No nosso caso há um
motivo adicional e mais forte: a raiz `alvesmaia.com` já tem MX apontando para o
Microsoft 365. Verificar a Resend em `mail.alvesmaia.com` mantém a configuração de
e-mail existente **completamente intocada** — nenhum registro de MX, SPF, DKIM ou DMARC
da raiz é alterado.

## Implantação

- **Repositório:** `github.com/alvesmaia/alvesmaia-site`, público
- **Cloudflare Pages** conectado ao repo, publica a cada push na `main`
- **Sem build step** — arquivos estáticos servidos direto
- **Preview automático** por branch/PR
- **Domínio:** `alvesmaia.com` + `www.alvesmaia.com` apontando para o projeto Pages.
  Cria apenas registros de tráfego web (A/AAAA/CNAME); não toca em e-mail
- **Segredos** como variáveis de ambiente criptografadas no Pages, nunca no repositório:
  - `RESEND_API_KEY`
  - `TURNSTILE_SECRET_KEY`

## Tratamento de erros

| Situação | Comportamento |
|---|---|
| Campo obrigatório vazio | Validação do navegador (`required`) barra antes de enviar |
| E-mail malformado | `type="email"` no cliente + revalidação no servidor |
| Turnstile inválido ou ausente | Function rejeita, redireciona com erro |
| API da Resend falha | Function registra no log da Cloudflare, redireciona com erro genérico |
| JavaScript desabilitado | Formulário continua funcionando (POST clássico) |

**Limitação conhecida e aceita:** no caminho de erro o visitante precisa redigitar a
mensagem, porque o padrão POST-redirect não preserva os valores. Aceitável para a
primeira versão, dado que o erro é raro. Se incomodar, a correção é preservar os campos
via query string ou migrar para envio por `fetch`.

## Verificação

Não há suíte de testes automatizados — para um site institucional de 4 páginas seria
mais custo que benefício. A verificação é um checklist manual, executado após a publicação:

1. As 4 páginas renderizam corretamente em desktop e mobile
2. Navegação funciona entre todas as páginas, em ambas as larguras
3. Tema claro e escuro conferidos
4. Formulário enviado de verdade → mensagem chega em `contato@alvesmaia.com`
5. Responder no Outlook vai para o e-mail do visitante (valida o `reply_to`)
6. Turnstile aparece e bloqueia envio sem interação
7. Com JavaScript desabilitado: formulário envia **e** menu mobile abre/fecha
8. `alvesmaia.com` e `www.alvesmaia.com` ambos resolvem e servem o site
9. **Regressão de e-mail:** confirmar que MX, SPF, DKIM e DMARC seguem intactos após
   apontar o domínio para o Pages

O item 9 não é paranoia — é a única parte deste projeto que poderia quebrar algo que
já funciona.

## Decisões e trade-offs

| Decisão | Alternativa descartada | Motivo |
|---|---|---|
| HTML/CSS puro | Astro | Menos peças móveis; site pequeno; mantido por uma pessoa |
| Duplicar cabeçalho/rodapé nos 4 arquivos | Layout compartilhado | Custo aceitável em 4 páginas; evita build step |
| POST clássico + redirect | `fetch` com JS | Funciona sem JavaScript; Function mais simples |
| Resend | MailChannels | Programa gratuito da MailChannels para Workers encerrou em 2024 |
| Turnstile | reCAPTCHA | Nativo da Cloudflare, gratuito, mais discreto, melhor privacidade |
| Subdomínio de envio | Raiz do domínio | Protege a configuração de e-mail existente |
| Repo separado do `branding` | Subpasta em `branding` | Site tem ciclo de vida próprio; assets de marca são copiados |

### Sobre a duplicação de assets de marca

Os arquivos de marca são copiados de `C:/PROJETOS/branding/brand/` para este repositório.
`branding/` continua sendo a fonte da verdade. Se a marca mudar, os arquivos do site
precisam ser atualizados manualmente — aceito conscientemente, dado que a identidade
acabou de ser fechada e não deve mudar tão cedo.

## Riscos

| Risco | Mitigação |
|---|---|
| Apontar o domínio quebrar o e-mail | Item 9 do checklist; Pages só mexe em A/AAAA/CNAME |
| Chave da Resend vazar | Só como variável de ambiente no Pages; nunca commitada |
| Spam no formulário | Turnstile; limites da Resend (100/dia) contêm abuso |
| Domínio de envio não verificar | Verificação por DNS na Cloudflare, mesmo fluxo já feito com DKIM |
