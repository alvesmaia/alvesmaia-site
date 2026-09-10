# Site institucional Alvesmaia — Design

**Data:** 9 de setembro de 2026
**Revisado:** 10 de setembro de 2026 — publicação migrada para Azure, e-mail via Microsoft Graph
**Status:** Aprovado, em implementação

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
- Formulário de contato funcional via Azure Functions
- Toda submissão gravada no Azure Table Storage antes da tentativa de envio
- Envio de e-mail pelo Microsoft Graph, usando o tenant do Microsoft 365 já contratado
- Proteção anti-spam via Cloudflare Turnstile
- Publicação automática via Azure Static Web Apps conectado ao GitHub
- Domínio próprio (`alvesmaia.com` e `www.alvesmaia.com`)

## Fora de escopo

Decidido explicitamente com o cliente, não é esquecimento:

- **Blog / artigos** — exige manutenção contínua que não se justifica agora
- **Área do cliente / login** — exigiria autenticação e um modelo de dados de verdade
- **BIMI** — descartado; o Outlook (que o cliente e boa parte das PMEs usam) não renderiza
- **Framework JS (React/Next)** — peso desnecessário para site majoritariamente de conteúdo
- **Gerador estático (Astro)** — avaliado e descartado em favor de menos peças móveis
- **Painel para ler as submissões** — o Table Storage é rede de segurança, não interface.
  A leitura, quando necessária, é pelo Azure Storage Explorer

## Estrutura de páginas

### `index.html` — Início
- Hero com o slogan da marca: "Soluções sob medida para a sua empresa"
- Resumo dos 4 serviços
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
Voz institucional: quem fala é a Alvesmaia, não Uemerson. Uemerson aparece nomeado como
fundador, uma vez.

**Não simular equipe.** Voz institucional não autoriza inventar estrutura: nada de
"nossa equipe de especialistas". Pelo contrário — a seção "Clareza sobre o perfil de
projeto" declara abertamente que a operação é enxuta e que tipo de projeto isso exclui.
Honestidade sobre o tamanho é diferencial, não fraqueza, e é o que sustenta a promessa
de interlocutor único.

### `contato.html` — Contato
- Formulário (nome, e-mail, assunto, mensagem)
- E-mails diretos listados para quem preferir escrever sem formulário
- Estado de sucesso/erro após envio

## Base visual

- **Tokens:** reaproveita `brand/tokens.css` (copiado para o repo do site)
- **Tipografia:** Nunito Sans via Google Fonts
- **Logos:** variantes brancas — cabeçalho e rodapé ficam sobre fundo navy
- **Favicon:** conjunto completo já existente em `brand/favicon/`
- **Tema:** único, claro. Decisão de 10/09/2026 — o tema escuro deixava a leitura
  pesada demais para um site institucional. Cabeçalho, hero e rodapé em navy dão o
  contraponto escuro sem escurecer o corpo do texto
- **JavaScript próprio:** nenhum. O menu mobile usa CSS puro (checkbox oculto +
  `:checked`) e os avisos de estado usam `:target`, então navegação e formulário
  funcionam com JavaScript desabilitado. O único `<script>` do site é o widget do
  Turnstile, carregado da Cloudflare, presente apenas em `contato.html`

### Regra de cor herdada do manual

O ciano da marca (`#00A8E8`) reprova em contraste sobre branco (2,70:1). Para texto e
links usar `--am-ciano-700` (`#0077AB`, 4,97:1, AA). O ciano puro fica restrito a
elementos gráficos e fundos.

## Arquitetura do formulário

### Fluxo

1. Visitante preenche o formulário em `contato.html`
2. `POST` para `/api/contato` — formulário HTML clássico, sem depender de JavaScript
3. A Azure Function valida no servidor:
   - Campos obrigatórios presentes
   - Formato de e-mail
   - Token do Turnstile válido (verificação server-side contra a API da Cloudflare)
4. **Grava a submissão no Table Storage** com `enviado: false`
5. Obtém um token do Entra pelo fluxo client credentials
6. Envia o e-mail pelo Microsoft Graph
7. Atualiza a linha para `enviado: true` se o envio deu certo
8. Redireciona de volta com âncora de estado

A ordem dos passos 4 e 6 é deliberada: **grava antes de enviar**. Se o Graph falhar, o
lead está no Table Storage e pode ser recuperado. O desenho anterior perdia a mensagem.

### E-mail enviado

| Campo | Valor |
|---|---|
| Remetente | `no-reply@alvesmaia.com` |
| Destinatário | `contato@alvesmaia.com` |
| `replyTo` | e-mail informado pelo visitante |
| Assunto | `[Site] <assunto escolhido> — <nome>` |
| `saveToSentItems` | `false` |

O `replyTo` é o detalhe que importa no dia a dia: responder no Outlook vai direto para
o visitante, sem copiar endereço na mão.

### Por que Microsoft Graph e não um serviço de envio externo

Três alternativas foram avaliadas:

| Opção | Veredito |
|---|---|
| Resend | Grátis, mas adiciona um terceiro fornecedor e 3–4 registros DNS em `mail.alvesmaia.com` |
| Cloudflare Email Sending | Beta, exige Workers Paid (US$ 5/mês), e o binding `send_email` não existe em Pages Functions |
| **Microsoft Graph** | **Escolhido** |

O Graph vence por três motivos: nenhum fornecedor novo (o Microsoft 365 já é pago),
**nenhum registro DNS de envio** — o que elimina o risco mais sério do projeto — e
entrega interna ao tenant, já que remetente e destinatário são do mesmo domínio.

### Segurança da permissão do Graph

A permissão de aplicativo `Mail.Send` concede, por padrão, envio como **qualquer caixa
do tenant**. Isso é inaceitável para um segredo que vive num servidor web.

Mitigação obrigatória, não opcional: uma **Application Access Policy** do Exchange
Online restringindo o app registrado à caixa `no-reply@alvesmaia.com` e a nenhuma
outra. Sem essa política, o projeto não vai ao ar.

O client secret expira em no máximo 24 meses. A data de expiração entra no calendário
no momento da criação.

### Persistência

Azure Table Storage, tabela `submissoes`:

| Campo | Conteúdo |
|---|---|
| `partitionKey` | `AAAA-MM` da submissão |
| `rowKey` | timestamp ISO + sufixo aleatório |
| `nome`, `email`, `assunto`, `mensagem` | dados do formulário |
| `ip` | IP de origem, para investigar abuso |
| `enviado` | `false` na gravação, `true` após o Graph confirmar |

Table Storage e não Cosmos DB: para gravar submissões de formulário, o Cosmos é caro e
complexo sem contrapartida.

## Implantação

- **Repositório:** `github.com/alvesmaia/alvesmaia-site`, público
- **Azure Static Web Apps** (tier Free) conectado ao repo. O SWA cria o GitHub Action
  automaticamente na conexão; publica a cada push na `main`
- **Sem build step** para o site — arquivos estáticos servidos direto de `public/`
- **Preview automático** por PR
- **Domínio:** `alvesmaia.com` + `www.alvesmaia.com`. O apex resolve por CNAME
  flattening, suportado pela Cloudflare
- **Segredos** como Application Settings criptografadas no SWA, nunca no repositório:
  - `GRAPH_TENANT_ID`, `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET`
  - `TURNSTILE_SECRET_KEY`
  - `TABLES_CONNECTION_STRING`

### Impacto no DNS

Único registro novo na raiz: um `TXT` de validação de propriedade exigido pelo Azure.
Convive com o SPF do Microsoft 365 — múltiplos registros TXT no apex são válidos; o que
não pode existir é um segundo **SPF**, e não haverá. Mais um `CNAME` para `www` e o
apontamento do apex.

Nenhum registro de MX, SPF, DKIM ou DMARC é criado, alterado ou removido.

### Limites do tier Free que apertam

- **2 domínios customizados.** `alvesmaia.com` + `www` consomem exatamente os dois
- **Sem SLA**
- **0,25 GB por deploy** — o site tem ~50 KB, irrelevante
- **100 GB de banda/mês** — irrelevante nesta escala
- Alerta de orçamento em **US$ 1** configurado, para que consumo inesperado apareça

## Tratamento de erros

| Situação | Comportamento |
|---|---|
| Campo obrigatório vazio | Validação do navegador (`required`) barra antes de enviar |
| E-mail malformado | `type="email"` no cliente + revalidação no servidor |
| Turnstile inválido ou ausente | Function rejeita, redireciona para `#robo` |
| Falha ao gravar no Table Storage | Redireciona para `#erro`; não tenta enviar |
| Falha ao obter token do Entra | Linha fica `enviado: false`; redireciona para `#erro` |
| Graph recusa o envio | Linha fica `enviado: false`; redireciona para `#erro` |
| JavaScript desabilitado | Formulário continua funcionando (POST clássico) |

Toda falha registra no log do Azure. Sem log, uma credencial expirada some em silêncio
e cada lead perdido fica sem rastro.

**Limitação conhecida e aceita:** no caminho de erro o visitante precisa redigitar a
mensagem, porque o padrão POST-redirect não preserva os valores. Aceitável para a
primeira versão. Atenuada pelo Table Storage: mesmo que o visitante desista, a
mensagem foi gravada.

## Verificação

As 4 páginas estáticas não têm testes automatizados — para HTML sem lógica seria mais
custo que benefício. A **Function, sim**: ela tem ramificação real (validação,
Turnstile, Table Storage, Graph) e falha em silêncio significa lead perdido. Testes em
Vitest, dependência de desenvolvimento apenas.

Além dos testes, um checklist manual executado após a publicação:

1. As 4 páginas renderizam corretamente em desktop e mobile
2. Navegação funciona entre todas as páginas, em ambas as larguras
3. Tema claro e escuro conferidos
4. Formulário enviado de verdade → mensagem chega em `contato@alvesmaia.com`
5. Responder no Outlook vai para o e-mail do visitante (valida o `replyTo`)
6. A submissão aparece no Table Storage com `enviado: true`
7. Turnstile aparece e bloqueia envio sem interação
8. Com JavaScript desabilitado: formulário envia **e** menu mobile abre/fecha
9. `alvesmaia.com` e `www.alvesmaia.com` ambos resolvem e servem o site
10. **Application Access Policy:** confirmar que o app **não** consegue enviar como
    `uemerson@alvesmaia.com`
11. **Regressão de e-mail:** confirmar que MX, SPF, DKIM e DMARC seguem intactos

Os itens 10 e 11 não são paranoia. O 11 protege algo que já funciona; o 10 é a
diferença entre um segredo vazado mandar spam e um segredo vazado se passar por você.

## Decisões e trade-offs

| Decisão | Alternativa descartada | Motivo |
|---|---|---|
| Tema único claro | Claro + escuro automático | Escuro pesava demais para site institucional |
| Voz institucional | Primeira pessoa | É uma empresa que se apresenta, não uma pessoa |
| HTML/CSS puro | Astro | Menos peças móveis; site pequeno; mantido por uma pessoa |
| Duplicar cabeçalho/rodapé nos 4 arquivos | Layout compartilhado | Custo aceitável em 4 páginas; evita build step |
| POST clássico + redirect | `fetch` com JS | Funciona sem JavaScript; Function mais simples |
| Azure Static Web Apps | Cloudflare Pages | Consolida tudo no tenant Microsoft já contratado |
| Microsoft Graph | Resend, Cloudflare Email Sending | Sem fornecedor novo, sem DNS de envio |
| Table Storage | Cosmos DB | Cosmos é caro e complexo para gravar formulário |
| Turnstile | reCAPTCHA | Gratuito, discreto, melhor privacidade |
| Repo separado do `branding` | Subpasta em `branding` | Site tem ciclo de vida próprio |

### Sobre a mudança de Cloudflare Pages para Azure

O desenho original publicava no Cloudflare Pages com envio pela Resend. A revisão de
10/09/2026 migrou para Azure a pedido do cliente, com o objetivo de manter tudo no
tenant Microsoft exceto o domínio.

O que se aproveitou integralmente: as 4 páginas, o CSS, os tokens e a lógica de
validação com seus testes. O que se reescreveu: a Function e os passos de publicação.

O Turnstile permanece na Cloudflare. É a única dependência de terceiros que sobra, e
não tem equivalente gratuito no Azure.

### Sobre a duplicação de assets de marca

Os arquivos de marca são copiados de `C:/PROJETOS/branding/brand/` para este repositório.
`branding/` continua sendo a fonte da verdade. Se a marca mudar, os arquivos do site
precisam ser atualizados manualmente — aceito conscientemente.

## Riscos

| Risco | Mitigação |
|---|---|
| `Mail.Send` permitir envio como qualquer caixa | Application Access Policy restrita a `no-reply@`; item 10 do checklist |
| Client secret expirar sem aviso | Data de expiração no calendário na criação |
| Client secret vazar | Só como Application Setting no SWA; nunca commitado |
| Apontar o domínio quebrar o e-mail | Item 11 do checklist; só se cria TXT e CNAME |
| Consumo inesperado no Azure | Alerta de orçamento em US$ 1 |
| Spam no formulário | Turnstile; Table Storage guarda o IP para investigar |
| Estourar os 2 domínios do tier Free | Conhecido; um terceiro hostname exige Standard |
