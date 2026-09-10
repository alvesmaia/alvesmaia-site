# Handoff: Site institucional Alvesmaia — v2

## O que mudou na v2

- Cartão do herói virou **carrossel de cinco fluxos** (Fiscal, Jurídico, RH, Financeiro,
  Operações) com animação etapa a etapa, selo de conclusão e transição lateral — ver a seção
  "Cartão de fluxos", nova e detalhada.
- Pill do herói: "Transformação digital".
- **Acento da marca mudou de ciano para índigo** `#4F6BFF` — ver "Design Tokens" e "Assets".
- Tema escuro passou a ser **cinza-grafite estilo Notion** (`#191919`), não mais azul-marinho.
- Removida a família monoespaçada: **tudo em Nunito Sans**.
- Ícones de tema trocados por **Lucide** (sun/moon); logo alternado por CSS, sem `src` dinâmico.
- Contraste de `--faint` corrigido para passar em AA.
- Seções renomeadas para os termos usuais do segmento e removida a seção de materiais internos.
- Formulário sem o seletor de interesse; e-mail só no rodapé.

## Overview

Site institucional de página única (one-page com âncoras) da **Alvesmaia — Consultoria de TI**.
Posicionamento: automação de processos (RPA), integrações entre sistemas, Power Platform,
plataformas internas, dados/relatórios e discovery de processos.

Objetivo da página: levar o visitante ao formulário de contato ("30 minutos de diagnóstico"),
apresentando serviços, aplicações por área, formatos de contratação, metodologia e FAQ.

Público: empresas de pequeno e médio porte com rotinas administrativas, financeiras e
operacionais manuais. Idioma: **português do Brasil**. Todo o copy do protótipo é final —
use exatamente como está.

> Contexto importante: a Alvesmaia **não comercializa produto próprio nem licenças**.
> Não introduza nada que sugira produto SaaS, marketplace, revenda de licença ou base de
> clientes existente. Não há depoimentos, cases ou logos de clientes — isso é deliberado.

## About the Design Files

Os arquivos deste pacote são **referências de design feitas em HTML** — protótipos que mostram
aparência e comportamento pretendidos, **não código de produção para copiar**.

`Alvesmaia Site.dc.html` é um "Design Component": um HTML com um pequeno runtime
(`support.js`, não incluído) que interpreta `{{ hole }}`, `<sc-if>` e atributos `style-hover` /
`style-focus`. **Ele não roda fora daquele ambiente.** Trate-o como fonte de verdade visual:
abra, inspecione medidas e copie os valores. A tarefa é **recriar este design no ambiente do
codebase alvo** (Next.js/React, Astro, Vue, WordPress etc.) com os padrões já estabelecidos lá.
Se não houver codebase, a recomendação é **Next.js (App Router) + CSS Modules ou Tailwind**,
por ser um site estático com um único formulário.

Traduções de sintaxe do protótipo:

| No protótipo | No código real |
|---|---|
| `style-hover="..."` | `:hover` no CSS |
| `style-focus="..."` | `:focus` no CSS |
| `<sc-if value="{{ x }}">` | render condicional |
| `data-tema="{{ tema }}"` | atributo de tema no elemento raiz |
| estilos inline | classes/CSS Modules/Tailwind |

## Fidelity

**High-fidelity.** Cores, tipografia, espaçamentos, raios e estados são finais. Recrie
pixel-a-pixel. Os valores abaixo são exatos e conferidos contra o protótipo.

---

## Design Tokens

Definidos como CSS custom properties em dois blocos: `:root, [data-tema="claro"]` e
`[data-tema="escuro"]`. **Claro é o padrão.**

### Tema claro (padrão)

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#FFFFFF` | fundo da página |
| `--bg-alt` | `#F6F9FC` | fundo de seções alternadas |
| `--card` | `#FFFFFF` | cartões |
| `--card-2` | `#F1F7FC` | cartão em destaque, linhas realçadas |
| `--rule` | `#D7E2EC` | bordas e divisores |
| `--rule-2` | `#B9C8D6` | bordas de botão secundário |
| `--rule-3` | `#EAF1F7` | divisores internos |
| `--ink` | `#102A43` | títulos |
| `--text` | `#0F1E2B` | corpo forte |
| `--muted` | `#5A7189` | corpo secundário |
| `--faint` | `#4E6478` | rótulos e legais (10.5–14px) |
| `--link` | `#3A4FD8` | links e eyebrows |
| `--cta` | `#3A4FD8` | fundo de botão primário |
| `--cta-hover` | `#2E3FB8` | hover do primário |
| `--acento` | `#4F6BFF` | acento cheio (traço do fluxo, spinner, logo) |
| `--cta-ink` | `#FFFFFF` | texto sobre o primário |
| `--ok` | `#0E7A54` | check ✓ |
| `--warn` | `#96600B` | atenção |
| `--danger` | `#B02E21` | erro |
| `--chip` | `#EEF1FF` | fundo de badge/ícone |
| `--header` | `rgba(255,255,255,.86)` | header translúcido |
| `--hero` | `radial-gradient(900px 420px at 18% -10%, #E7ECFF 0%, #FFFFFF 62%)` | fundo do herói |
| `--shadow` | `0 18px 44px rgba(16,42,67,.10)` | sombra |

### Tema escuro (base cinza-grafite, estilo Notion)

| Token | Valor |
|---|---|
| `--bg` | `#191919` |
| `--bg-alt` | `#1E1E1E` |
| `--card` | `#202020` |
| `--card-2` | `#272727` |
| `--rule` | `#2F2F2F` |
| `--rule-2` | `#3D3D3D` |
| `--rule-3` | `#252525` |
| `--ink` | `#FFFFFF` |
| `--text` | `#EDEDED` |
| `--muted` | `#A5A5A5` |
| `--faint` | `#9A9A9A` |
| `--link` | `#8FA3FF` |
| `--cta` | `#8FA3FF` |
| `--cta-hover` | `#AEBCFF` |
| `--cta-ink` | `#08122E` |
| `--acento` | `#4F6BFF` |
| `--ok` | `#4FC79A` |
| `--warn` | `#E0A661` |
| `--danger` | `#F08B7C` |
| `--chip` | `#232733` |
| `--header` | `rgba(25,25,25,.86)` |
| `--hero` | `radial-gradient(900px 420px at 18% -8%, #232A3D 0%, #191919 62%)` |
| `--shadow` | `0 24px 60px rgba(0,0,0,.6)` |

> Acessibilidade: `--faint` foi escurecido de propósito (`#4E6478` no claro) para que rótulos de
> 10.5–14px passem em AA (≥4.5:1). **Não voltar para `#6C8298`** — reprova.
> O acento cheio `#4F6BFF` **não é cor de texto sobre branco** (3.4:1) nem fundo de texto branco
> em botão pequeno (4.30:1); por isso o tema claro usa `#3A4FD8` em links e no fundo do CTA, e o
> tema escuro usa `#8FA3FF` com tinta `#08122E`. O acento cheio serve para **formas**: traço do
> fluxo, spinner, o "M" do logo.

### Cores de marca (origem)

Vêm de `brand/tokens.css` da identidade Alvesmaia:
navy `#102A43`, ciano `#00A8E8`, ciano-600 `#0089C4`, ciano-700 `#0077AB`,
ciano-100 `#E2F3FC`, neutros 50→900 `#F6F9FC #EAF1F7 #D7E2EC #B9C8D6 #6C8298 #5A7189 #3A5163 #0F1E2B`,
semânticas sucesso `#0E7A54`, atenção `#96600B`, erro `#B02E21`, info `#0077AB`.

### Sistema de acento (trocável)

O acento é um eixo próprio, independente do tema, publicado como `data-acento` no mesmo
elemento raiz que carrega `data-tema`. **Índigo é o padrão** e está escrito direto nas
variáveis base — a página pinta índigo desde o primeiro frame, sem depender do atributo.
As outras duas variantes existem apenas como alternativa de avaliação e podem ser descartadas
na implementação.

| variante | acento | claro: link/CTA | claro: hover | escuro: link/CTA | escuro: tinta |
|---|---|---|---|---|---|
| **indigo** (padrão) | `#4F6BFF` | `#3A4FD8` | `#2E3FB8` | `#8FA3FF` | `#08122E` |
| ciano (antigo) | `#00A8E8` | `#0089C4` | `#0077AB` | `#00A8E8` | `#04222F` |
| azul elétrico | `#2E7DFF` | `#1B5FD9` | `#154BAE` | `#7FB0FF` | `#04162E` |

Cada variante redefine `--acento`, `--link`, `--cta`, `--cta-hover`, `--cta-ink`,
`--chip` e `--hero`, em pares `[data-tema][data-acento]`. Tudo o mais herda.

### Tipografia

Família única: **Nunito Sans** (Google Fonts, SIL OFL), pesos **400, 600, 700, 900**.
Fallback: `"Segoe UI", Helvetica, Arial, sans-serif`. `-webkit-font-smoothing: antialiased`.

| Papel | Tamanho | Peso | Outros |
|---|---|---|---|
| H1 herói | `clamp(38px, 5.2vw, 60px)` | 900 | `letter-spacing:-.03em; line-height:1.04; text-wrap:balance` |
| H2 seção grande | `clamp(28px, 3.4vw, 38px)` | 900 | `letter-spacing:-.025em` |
| H2 seção menor | `clamp(26px, 3vw, 34px)` | 900 | `letter-spacing:-.025em` |
| H3 card | 18px (17px/16.5px em grades) | 800 | `letter-spacing:-.01em` |
| H3 plano | 19px | 800 | — |
| Lead do herói | 18.5px | 400 | `line-height:1.6; max-width:56ch` |
| Lead de seção | 17px | 400 | `line-height:1.65; max-width:64ch` |
| Corpo de card | 14.5px | 400 | `line-height:1.6` |
| Corpo de FAQ | 15px | 400 | `line-height:1.65; max-width:70ch` |
| Nav | 14.5px | 600 | — |
| Botão | 14–15.5px | 700–800 | — |
| Eyebrow de seção | 11px | 400 | `letter-spacing:.16em; text-transform:uppercase; color:var(--link)` |
| Rótulo de formulário | 10.5px | 400 | `letter-spacing:.13em; text-transform:uppercase; color:var(--faint)` |
| Micro/legal | 11–13.5px | 400 | `color:var(--faint)` |
| Número grande (Sobre) | 26px | 900 | `letter-spacing:-.03em` |
| Preço | 30px | 900 | `letter-spacing:-.03em` |

> Não use fonte monoespaçada em lugar nenhum. Os rótulos em caixa alta são Nunito Sans
> com `letter-spacing` largo — isso é intencional.

### Espaçamento, raios e sombra

- Contêiner: `max-width:1200px; margin:0 auto; padding:0 24px`. FAQ usa `max-width:860px`.
- Padding vertical de seção: `84px` topo e base. Herói: `76px / 68px`. Faixa de stack: `26px`.
- Rodapé: `56px 24px 28px` + barra final `padding-top:20px; padding-bottom:40px`.
- Gaps: grades de card `16px`; grades de planos `18px`; colunas de seção `48px`; grades
  "coladas" (Soluções, Metodologia, Sobre) usam `gap:1px` sobre `background:var(--rule)` para
  simular divisores de 1px.
- Raios: card `10px`; card de plano e formulário `12px`; botão `6–7px`; ícone de card `8px`;
  chip/pill `100px`; ponto/status `50%`.
- Bordas: sempre `1px solid var(--rule)` (ou `var(--rule-2)`, `var(--cta)` no plano destacado).
- Sombra: só no card do herói, no plano destacado e no formulário (`var(--shadow)`).

---

## Screens / Views

Uma única página, seções ancoradas. Ordem e IDs:

`#topo` (herói) → faixa de tecnologias (`#stack`) → `#servicos` → `#casos` → `#modelos` →
`#metodo` → `#sobre` → `#faq` → `#contato` → rodapé.

Padrão de seção: fundo alterna entre `var(--bg)` e `var(--bg-alt)`; toda seção tem
`border-bottom:1px solid var(--rule)`; cada uma abre com eyebrow numerado + H2 (+ lead opcional).

### Header (sticky)

- `position:sticky; top:0; z-index:50; background:var(--header); backdrop-filter:blur(12px); border-bottom:1px solid var(--rule)`.
- Interno: `max-width:1200px; padding:0 24px; height:64px; display:flex; align-items:center; gap:28px`.
- **Logo** (`height:26px`, link para `#topo`): dois `<img>`, um por tema — ver "Assets".
- **Nav** (`flex:1`, `gap:22px`, `flex-wrap:wrap`, 14.5px/600, `color:var(--muted)`, hover `var(--ink)`):
  Serviços · Soluções · Planos · Metodologia · Sobre · FAQ →
  `#servicos #casos #modelos #metodo #sobre #faq`.
- **Botão de tema**: quadrado `36×36`, `border:1px solid var(--rule)`, raio 6px, fundo
  transparente, `color:var(--muted)`, hover `color:var(--ink); border-color:var(--rule-2)`.
  Ícones **Lucide** 17×17, `stroke-width:2`, `currentColor`: `moon` no tema claro,
  `sun` no tema escuro.
- **CTA**: "Falar com um especialista" — 14px/800, `background:var(--cta)`,
  `color:var(--cta-ink)`, `padding:9px 16px`, raio 6px, hover `var(--cta-hover)`, âncora `#contato`.

### 1. Herói `#topo`

Fundo `var(--hero)`. Grade `repeat(auto-fit, minmax(340px,1fr))`, `gap:52px`, `align-items:center`.

**Coluna esquerda**
- Pill: "Transformação digital" — 11px, `letter-spacing:.16em`, uppercase,
  `color:var(--link)`, `border:1px solid var(--rule-2)`, `background:var(--chip)`,
  `padding:6px 11px`, raio 100px.
- H1: **"Soluções sob medida para a sua empresa"** (slogan oficial da marca — não alterar).
- Lead: "Automatizamos o trabalho repetitivo que hoje mora em planilha, e-mail e copiar-colar
  entre sistemas. Robôs, integrações e aplicações internas construídos sobre o que a sua
  empresa já paga."
- Botões (`gap:12px`, `flex-wrap:wrap`, `margin-top:30px`, 15.5px, `padding:14px 24px`, raio 7px):
  primário "Mapear um processo" → `#contato`; secundário "Ver o que fazemos" → `#servicos`
  (`border:1px solid var(--rule-2)`, hover `border-color:var(--muted); color:var(--ink)`).

**Coluna direita — cartão de fluxos animados** (ver seção dedicada "Cartão de fluxos" mais abaixo)

### 2. Faixa de tecnologias `#stack`

`background:var(--bg-alt)`, `padding:26px 24px`, flex `space-between`, `gap:32px`, wrap.
Rótulo "Construímos sobre" (11px, `.14em`, uppercase, `var(--faint)`).
Chips (14px/700, `border:1px solid var(--rule)`, `background:var(--card)`, raio 6px, `padding:8px 14px`, `gap:12px`):
**Power Automate · Power Apps · Power BI · Dataverse · Microsoft 365 · Python · APIs REST · SQL**.

### 3. Serviços `#servicos`

Eyebrow "01 · Serviços". H2 "Tirar processo repetitivo das mãos das pessoas".
Lead: "Cada entrega parte de um processo real da sua operação — não de uma licença que
precisamos vender. Se dá para resolver com o que você já tem, é o que fazemos."

Grade `repeat(auto-fill, minmax(280px,1fr))`, `gap:16px`, `margin-top:38px`.
Card: `border:1px solid var(--rule)`, raio 10px, `background:var(--card)`, `padding:24px`,
hover `border-color:var(--rule-2)`. Dentro: quadrado numerado `36×36`, raio 8px,
`background:var(--chip)`, `border:1px solid var(--rule)`, número 14px `var(--link)`;
H3 18px/800 `margin:16px 0 8px`; parágrafo 14.5px `var(--muted)`.

1. **Automação de processos (RPA)** — "Robôs que executam a rotina do jeito que a pessoa executa hoje: abrir sistema legado sem API, baixar relatório, conferir, lançar, arquivar. Com log de cada execução e tratamento de exceção — o que o robô não souber decidir volta para um humano."
2. **Integrações entre sistemas** — "ERP, CRM, e-commerce, banco, planilha e API de terceiro conversando sem alguém no meio digitando duas vezes. Com fila, reprocessamento e alerta de falha — integração que quebra em silêncio é pior que não ter."
3. **Power Platform** — "Power Apps para o formulário que hoje é planilha compartilhada, Power Automate para o fluxo de aprovação, Power BI para parar de montar relatório na mão. Dentro do Microsoft 365 que a empresa já assina."
4. **Plataformas internas** — "Portal, painel operacional ou sistema sob medida, com login corporativo e perfis de acesso — para quando o processo já não cabe em app de baixo código."
5. **Dados e relatórios** — "Consolidação das bases que hoje estão espalhadas, modelo de dados e painel que abre atualizado — em vez de um PDF que alguém monta toda segunda-feira."
6. **Discovery de processo** — "Antes de automatizar: mapear, medir e cortar o que não deveria existir. Automatizar processo ruim só faz o erro acontecer mais rápido."

### 4. Soluções `#casos`

`background:var(--bg-alt)`. Eyebrow "02 · Soluções".
H2 "Se alguma destas é a sua rotina, dá para automatizar".
Grade colada `repeat(auto-fit, minmax(250px,1fr))`, `gap:1px` sobre `var(--rule)`,
borda 1px, raio 10px, `overflow:hidden`; células `background:var(--card); padding:24px`;
H3 16.5px/800; texto 14.5px `var(--muted)`.

- **Financeiro e fiscal** — Conciliação bancária, captura de notas, lançamento em ERP, régua de cobrança.
- **Backoffice e RH** — Admissão, checklist de documentos, aprovação de despesa, geração de contrato.
- **Comercial** — Proposta gerada do CRM, follow-up automático, pipeline sem planilha paralela.
- **Operação e logística** — Sincronizar pedido entre marketplace e ERP, atualizar estoque, avisar exceção.

### 5. Planos `#modelos`

Eyebrow "03 · Planos". H2 "Três formatos, escopo declarado".
Lead: "Não vendemos licença nem produto de prateleira. O que você contrata é entrega — e o que
for construído fica documentado, no seu ambiente e no seu nome."

Grade `repeat(auto-fit, minmax(290px,1fr))`, `gap:18px`, `align-items:start`.
Card padrão: `border:1px solid var(--rule)`, raio 12px, `background:var(--card)`, `padding:28px`.
Card do meio (destaque): `border:1px solid var(--cta)`, `background:var(--card-2)`, `box-shadow:var(--shadow)`,
com badge "mais comum" (10px, `.13em`, uppercase, `background:var(--cta)`, `color:var(--cta-ink)`,
`padding:5px 9px`, raio 100px).

Estrutura interna: H3 19px/800 → descrição 14px `var(--muted)` → **bloco de preço** →
lista de itens → botão.

**Bloco de preço** (condicional, ver "State"): `margin-top:20px`, `padding:16px 0`,
borda superior e inferior 1px `var(--rule)`; texto **"sob consulta"** 30px/900,
`letter-spacing:-.03em`, `color:var(--ink)`. *Não há subtítulo sob o preço.*

Itens: `display:flex; gap:10px`, 14.5px `var(--text)`, `line-height:1.5`, marcador `✓` em
`var(--ok)` com `font-weight:800` e `flex:none`.

| Plano | Descrição | Itens | Botão |
|---|---|---|---|
| **Prova de conceito** | Um processo, escopo curto. Para ver a automação rodando antes de decidir o resto. | Mapeamento do processo escolhido · Automação funcional em ambiente de teste · Estimativa de ganho e do esforço para escalar | secundário "Começar por aqui" |
| **Projeto** (destaque) | Escopo, prazo e preço fechados. Do desenho à entrega em produção, com treinamento. | Desenho da solução e documentação · Construção, testes e homologação com a área · Publicação no seu tenant e treinamento · Garantia de correção após a entrega | primário "Solicitar contato" (`padding:13px`) |
| **Evolução contínua** | Horas mensais para sustentar o que está rodando e automatizar o próximo da fila. | Correção quando o sistema de origem muda · Ajustes e novas regras nos fluxos existentes · Fila priorizada com você a cada mês | secundário "Conversar" |

Botões dos planos: largura total, `text-align:center`, `margin-top:24px`, raio 7px,
`padding:12px` (secundário) / `13px` (primário).

### 6. Metodologia `#metodo`

`background:var(--bg-alt)`. Eyebrow "04 · Metodologia".
H2 "Da primeira conversa ao fluxo em produção".
Grade colada `repeat(auto-fit, minmax(230px,1fr))`, `gap:1px`, células `padding:26px`.
Cada etapa: número 11px `letter-spacing:.14em` `var(--link)`; H3 17px/800 `margin:12px 0 8px`;
texto 14.5px `var(--muted)`.

1. **Mapear** — "30 minutos por vídeo, sem custo. Você mostra o processo como ele é hoje; eu digo se vale automatizar."
2. **Desenhar e orçar** — "Fluxo proposto, sistemas envolvidos, exceções previstas, prazo e preço. O que não entra também fica escrito."
3. **Construir e homologar** — "Entregas parciais para a área validar cedo. Quem usa o processo testa antes de virar produção."
4. **Publicar e transferir** — "Publicação no seu ambiente, documentação, treinamento e monitoramento das execuções."

### 7. Sobre `#sobre`

Duas colunas `repeat(auto-fit, minmax(300px,1fr))`, `gap:48px`, `align-items:center`.
Esquerda: eyebrow "05 · Sobre"; H2 "Operação enxuta, compromissos claros"; parágrafo 16.5px
"Consultoria pequena tem uma vantagem que a grande não consegue imitar: quem conversa com você
é quem constrói. E tem um limite honesto: um projeto por vez, bem feito."
Direita: grade colada 2×2 (`minmax(150px,1fr)`, `gap:1px`), células `padding:24px`,
título 26px/900 `var(--ink)` + descrição 14px `var(--muted)`:

- **Sem lock-in** — Fluxos e código no seu tenant, no seu repositório
- **Preço fechado** — Escopo definido antes; mudança vira aditivo combinado
- **Documentado** — Cada entrega sai com desenho do fluxo e manual de operação
- **Interlocutor único** — Sem repassar o contexto para um time que troca a cada mês

### 8. FAQ `#faq`

Contêiner `max-width:860px`. Eyebrow "06 · FAQ". H2 "Perguntas frequentes" (`margin:12px 0 26px`).
Cinco itens `<details>`: `border-top:1px solid var(--rule)`, `padding:18px 0`; o último também
tem `border-bottom`. `summary`: `cursor:pointer`, marcador nativo removido
(`list-style:none` + `::-webkit-details-marker{display:none}`), 16.5px/700 `var(--text)`,
`display:flex; justify-content:space-between; gap:16px`, com um `+` em `var(--link)` à direita;
hover `color:var(--ink)`. Resposta: 15px, `line-height:1.65`, `var(--muted)`,
`margin-top:12px`, `max-width:70ch`.

1. **Preciso ter Power Platform para contratar?** — "Não. Se a empresa já usa Microsoft 365, boa parte do que é preciso já está incluída e o custo adicional pode ser zero. Quando o caso exige conector premium ou execução desassistida, isso é dito na proposta com o valor estimado — antes de você decidir."
2. **E se o meu sistema não tem API?** — "É o caso mais comum. Quando não há API, o robô opera a interface como um usuário — com validação a cada passo e evidência do que fez. Quando há API, ela é sempre a primeira escolha: é mais rápida e quebra menos."
3. **O que acontece quando a automação falha?** — "Toda entrega prevê a falha: log de execução, notificação para o responsável e uma rota manual para o caso não tratado. Automação sem plano de exceção só transfere o problema de lugar."
4. **A automação fica presa a vocês?** — "Não. Tudo é publicado no seu tenant, com a documentação do fluxo e das credenciais usadas. Se você quiser levar a manutenção para dentro ou para outro fornecedor, sai com o material completo."
5. **Quanto tempo leva a primeira entrega?** — "Uma prova de conceito de um processo costuma ficar pronta em duas a três semanas, dependendo do acesso aos sistemas. Projetos maiores são quebrados em etapas para você ver resultado antes do fim."

### 9. Contato `#contato`

Sem `border-bottom`. Duas colunas `repeat(auto-fit, minmax(320px,1fr))`, `gap:48px`, `align-items:start`.

**Esquerda**: eyebrow "07 · Contato"; H2 "Traga um processo, saia com um diagnóstico"
(`clamp(28px,3.4vw,40px)`, `letter-spacing:-.03em`, `text-wrap:balance`); lead 17px
"Trinta minutos por vídeo. Você mostra a rotina como ela é hoje e recebe uma leitura honesta:
dá para automatizar, quanto custaria e o que dá para fazer antes disso de graça.";
linha 13px `var(--faint)` `margin-top:28px`: "Atendimento de segunda a sexta, das 9h às 18h."
**Nenhum e-mail é exibido aqui** — o único e-mail da página fica no rodapé.

**Direita — formulário**: `border:1px solid var(--rule)`, raio 12px, `background:var(--card)`,
`padding:28px`, `display:flex; flex-direction:column; gap:16px`, `box-shadow:var(--shadow)`.

Campos, na ordem:
1. Linha de dois (`grid repeat(auto-fit,minmax(160px,1fr)); gap:16px`): **Nome**
   (placeholder "Seu nome") e **Empresa** (placeholder "Razão social").
2. **E-mail corporativo** — largura total, `type="email"`, placeholder "voce@empresa.com.br".
3. **Descreva o processo** — `<textarea rows="4">`, `resize:vertical`, placeholder
   "Ex.: todo dia alguém baixa 40 notas do e-mail, confere no ERP e lança na planilha do financeiro".

Cada campo é um `<label>` em coluna (`gap:7px`) com o rótulo em 10.5px uppercase
`letter-spacing:.13em` `var(--faint)`. Inputs: 15px, `color:var(--text)`,
`background:var(--bg)`, `border:1px solid var(--rule)`, raio 7px, `padding:11px 13px`,
`outline:none`, foco `border-color:var(--cta)`.
> Os inputs herdariam o uppercase do label — o protótipo corrige com
> `text-transform:none; letter-spacing:normal` no input. Em CSS real, basta não herdar.

Botão submit: largura total, 15.5px/800, `background:var(--cta)`, `color:var(--cta-ink)`,
sem borda, raio 7px, `padding:14px`, `cursor:pointer`, hover `var(--cta-hover)` —
**"Agendar os 30 minutos"**.

Mensagem de sucesso (só após envio): 12.5px `var(--ok)` — "Recebido. Respondo em até 1 dia útil."

Nota final: 11px `var(--faint)`, `line-height:1.6` — "Seus dados são usados só para responder
este contato — nada de lista de disparo. Tratamento conforme a LGPD."

### 10. Rodapé

`border-top:1px solid var(--rule)`, `background:var(--bg-alt)`.
Grade `repeat(auto-fit, minmax(200px,1fr))`, `gap:40px`, `padding:56px 24px 28px`.

- **Coluna 1**: logo (`height:24px`) + "Consultoria de TI. Soluções sob medida para a sua empresa."
  (14px, `var(--faint)`, `max-width:34ch`).
- **Serviços**: Automação (RPA) · Integrações · Power Platform · Plataformas internas → `#servicos`.
- **Empresa**: Planos (`#modelos`) · Metodologia (`#metodo`) · Sobre (`#sobre`) · FAQ (`#faq`).
- **Contato**: `contato@alvesmaia.com` (mailto) e "CNPJ 00.000.000/0001-00" (**placeholder — substituir**).

Cabeçalhos de coluna: 10.5px, `.14em`, uppercase, `var(--faint)`, `margin-bottom:2px`.
Links: 14px `var(--text)`, hover `var(--link)`, coluna com `gap:10px`.

Barra final: `border-top:1px solid var(--rule)`, `padding-top:20px`, `space-between`, wrap,
11.5px `var(--faint)` — "© 2026 Alvesmaia · alvesmaia.com" e "Privacidade · Termos"
(**criar as páginas ou remover**).

---

---

## Cartão de fluxos (coluna direita do herói)

O elemento mais complexo da página: um carrossel automático de **cinco fluxos de automação**,
um por área, que se anima etapa por etapa, marca conclusão e troca de fluxo em loop infinito.

### Estrutura

```
div[data-ativo][data-etapa]        ← card; os dois atributos comandam TODA a animação via CSS
├── div                            ← barra de título: três pontos de 9px em var(--rule-2)
│                                     padding:11px 14px; background:var(--bg-alt); borda inferior
├── div[data-caixa]                ← container do fluxo (position:relative)
│   │                                margin:24px 22px 20px; border:1px solid var(--rule);
│   │                                border-radius:10px; padding:16px
│   ├── span                       ← legenda sobre a linha: top:-9px; left:14px;
│   │                                background:var(--card); padding:0 8px; 11.5px/700 var(--muted)
│   │                                (cinco <span data-rotulo="0..4">, um visível por vez)
│   ├── div[data-palco]            ← overflow:hidden (recorte da transição lateral)
│   │   └── div[data-fluxo="0..4"] ← cinco fluxos; só o ativo em display:flex
│   │       ├── div[data-passo="1"]   linha da etapa
│   │       ├── svg.conector[data-passo="2"]
│   │       ├── div[data-passo="2"]
│   │       ├── svg.conector[data-passo="3"]
│   │       ├── div[data-passo="3"]
│   │       ├── svg.conector[data-passo="4"]
│   │       └── div[data-passo="4"]
│   ├── div[data-load]             ← spinner, canto superior direito
│   └── div[data-check]            ← selo de concluído, mesmo canto
└── div                            ← rodapé: ‹  barra de progresso  ›  (centralizado)
```

### Os cinco fluxos

Cada fluxo tem exatamente 4 etapas. Etapas 1 e 4 são "destacadas" (`background:var(--card-2)`,
`border-color:var(--rule-2)`); 2 e 3 são neutras (`var(--bg-alt)` / `var(--rule)`).
Cor do ícone: etapa 1 = `var(--link)`, etapas 2 e 3 = `var(--muted)`, etapa 4 = `var(--ok)`.

**0 — Fiscal — Conciliação de notas**
1. `mail` Nota fiscal chega no e-mail
2. `file-text` Lê o XML e confere CNPJ, valor e pedido
3. `database` Registra no ERP e arquiva no SharePoint
4. `bell` Divergência vira card no Teams

**1 — Jurídico — Ciclo de contratos**
1. `clipboard-check` Área solicita o contrato pelo formulário
2. `file-check` Minuta gerada do modelo aprovado
3. `pen-line` Vai para assinatura eletrônica
4. `calendar-check` Prazos e renovação entram na agenda

**2 — RH — Admissão de colaborador**
1. `clipboard-check` RH preenche o formulário de admissão
2. `file-check` Confere documentos e aponta pendências
3. `user-plus` Cria usuário, e-mail e acessos
4. `send` Kit de boas-vindas enviado ao gestor

**3 — Financeiro — Contas a pagar**
1. `mail` Boleto do fornecedor chega no e-mail
2. `file-check` Confere pedido, valor e centro de custo
3. `credit-card` Agenda o pagamento no ERP
4. `send` Comprovante volta para o fornecedor

**4 — Operações — Pedido do marketplace**
1. `shopping-cart` Pedido novo entra no marketplace
2. `refresh-cw` Sincroniza cliente e itens com o ERP
3. `package` Baixa estoque e gera a separação
4. `bar-chart` Painel de vendas atualiza sozinho

Todos os ícones são **Lucide**, 17×17, `stroke-width:1.8`, `currentColor`.

### Máquina de estados

Dois valores de estado: `fluxo` (0–4) e `etapa` (0–6), publicados como `data-ativo` e
`data-etapa` no card. Um único timer encadeado avança a etapa; ao passar de 6, incrementa o
fluxo (mod 5) e volta a etapa para 0.

| etapa | significado | duração até a próxima |
|---|---|---|
| 0 | fluxo entrando pela direita | 900 ms |
| 1 | etapa 1 ativa | 1700 ms |
| 2 | etapa 2 ativa | 1700 ms |
| 3 | etapa 3 ativa | 1700 ms |
| 4 | etapa 4 ativa | 1300 ms |
| 5 | concluído (selo + borda verde) | 2800 ms |
| 6 | saindo pela esquerda | 480 ms → próximo fluxo |

Ciclo completo por fluxo ≈ **10,6 s**. Implementação de referência:

```js
agendar() {
  clearTimeout(this.t);
  const e = this.etapa;
  const espera = e === 0 ? 900 : e < 4 ? 1700 : e === 4 ? 1300 : e === 5 ? 2800 : 480;
  this.t = setTimeout(() => {
    this.setEstado(s => s.etapa >= 6
      ? { fluxo: (s.fluxo + 1) % 5, etapa: 0 }
      : { etapa: s.etapa + 1 });
    this.agendar();          // reagendar SEMPRE dentro do próprio timer
  }, espera);
}
```

> Armadilha encontrada no protótipo: reagendar em `componentDidUpdate` faz a animação travar
> na primeira etapa. Reagende dentro do callback do timer/setState.

Setas ‹ › chamam `irPara(fluxo ± 1)`, que limpa o timer, zera a etapa e reagenda.
Ao implementar, considere pausar o loop em `prefers-reduced-motion` e quando o card sair da
viewport (IntersectionObserver).

### Animações — todas dirigidas por CSS a partir de `data-etapa` / `data-ativo`

**Revelação progressiva**: `[data-etapa] [data-passo]{opacity:.2}` e, por etapa *e*, os
`[data-passo]` de 1 até *e* recebem `opacity:1`. Transição `opacity .4s ease`.
Na etapa 6 todos voltam a `opacity:1` para a saída.

**Etapa em execução — contorno tracejado ciano correndo** (marching ants). Como `border` não
anima dash, cada linha de etapa contém um SVG sobreposto:

```html
<svg data-contorno width="100%" height="100%"
     style="position:absolute;inset:0;overflow:visible;pointer-events:none">
  <rect x="0" y="0" width="100%" height="100%" rx="8" ry="8"
        fill="none" stroke="var(--acento)" stroke-width="1.5" stroke-dasharray="8 6"></rect>
</svg>
```

```css
@keyframes girar { to { stroke-dashoffset: -28 } }
[data-contorno] { opacity: 0; transition: opacity .3s ease }
[data-contorno] rect { animation: girar 1.2s linear infinite }
[data-etapa="N"] [data-fluxo] > div[data-passo="N"] [data-contorno] { opacity: 1 }  /* N = 1..4 */
```

**Conectores**: SVG de 2×18 com `stroke-dasharray:4 4`, `margin-left:31px`, cor `var(--rule-2)`.
Só o conector da etapa atual anima (`@keyframes fluir{to{stroke-dashoffset:-16}}`, 1s linear
infinite); os conectores já percorridos ficam **sólidos** (`stroke-dasharray:none`).

**Transição entre fluxos**:

```css
@keyframes entrar { from { transform: translateX(22%); opacity: 0 } to { transform: none; opacity: 1 } }
[data-fluxo] { transition: transform .45s ease, opacity .45s ease }
[data-etapa="0"] [data-fluxo], [data-etapa="1"] [data-fluxo] { animation: entrar .5s ease both }
[data-etapa="6"] [data-fluxo] { transform: translateX(-22%); opacity: 0 }
```

O recorte vem de `[data-palco]{overflow:hidden}` — **não** coloque `overflow:hidden` no
`[data-caixa]`, senão o selo e o spinner (que ficam fora da borda) são cortados.

**Spinner (enquanto executa)**: círculo de 26px no canto superior direito
(`top:-13px; right:-13px`), `background:var(--card)`, `border:1px solid var(--rule)`;
dentro, SVG 16×16 com um `circle r=9` em `var(--rule)` e um arco de 90° em `var(--acento)`,
girando (`@keyframes rodar{to{transform:rotate(360deg)}}`, .9s linear infinite).
Desaparece nas etapas 5 e 6.

**Selo de concluído**: some no lugar do spinner (`top:-16px; right:-16px`, 38×38,
viewBox `-3 -3 30 30`). Composto de:
- **corola de 7 lóbulos** preenchida em `var(--ok)` — path gerado por programa: para cada
  lóbulo *i* de 7, ponto base no raio 8.2 e curva quadrática com controle no raio 11.4,
  centro (12,12);
- **tique** `M8.4 12.2l2.5 2.5 4.7-5`, `stroke:var(--card)`, `stroke-width:2.1`;
- **8 raios** de `stroke-width:1.5` em `var(--ok)`, do raio 13.6 ao 16.4, defasados meio setor.

```css
[data-check] { opacity: 0; transform: scale(.7);
  transition: opacity .3s ease, transform .3s cubic-bezier(.2,1.4,.5,1) }
[data-etapa="5"] [data-check], [data-etapa="6"] [data-check] { opacity: 1; transform: scale(1) }
@keyframes raiar { 0%{opacity:0;transform:scale(.55)} 55%{opacity:1} 100%{opacity:.55;transform:scale(1)} }
[data-raios] { transform-origin: 12px 12px; opacity: 0 }
[data-etapa="5"] [data-raios], [data-etapa="6"] [data-raios] { animation: raiar .5s ease-out .1s both }
```

**Container concluído**: `[data-caixa]` passa de `border-color:var(--rule)` para
`var(--ok)` com `box-shadow:0 0 0 3px rgba(14,122,84,.10)` nas etapas 5 e 6.

**Rodapé do card**: `border-top:1px solid var(--rule)`, `padding:12px 22px`,
`display:flex; justify-content:center; align-items:center; gap:14px` —
seta ‹ (26×26, borda `var(--rule)`, raio 6px, ícone Lucide `chevron-left` 14px),
**barra de progresso** de 26×4px (`background:var(--rule)`, raio 100px, `overflow:hidden`)
com preenchimento interno em `var(--cta)`, e seta ›.

Larguras do preenchimento por etapa: `4% 18% 42% 66% 86% 100% 100%`,
com `transition:width 1.4s linear` — exceto na etapa 0, que usa `.22s ease` para
**esvaziar rápido** ao trocar de fluxo.

> Nota de implementação: no protótipo, os estilos inline exigiram `!important` nas regras de
> largura e de borda tracejada. Em CSS de verdade isso não é necessário — use classes.

### Alinhamento

O rodapé usa `padding:12px 22px` justamente para que suas bordas coincidam com as do
`[data-caixa]` (que tem `margin` lateral de 22px). Mantenha os dois valores em sincronia.

## Interactions & Behavior

- **Navegação**: apenas âncoras internas. `html { scroll-behavior: smooth }`.
  Header sticky de 64px — compense com `scroll-margin-top: 80px` nas seções ao implementar.
- **Hover**: links de nav e rodapé mudam de cor; cards de serviço mudam `border-color` para
  `var(--rule-2)`; botões primários vão para `var(--cta-hover)`; secundários mudam
  `border-color` e `color`. Sem transições declaradas no protótipo — se adicionar,
  use algo curto e uniforme (`transition: color .15s ease, border-color .15s ease, background .15s ease`).
- **FAQ**: `<details>/<summary>` nativo, um item independente do outro (vários podem ficar
  abertos). Mantenha o elemento nativo — é acessível de graça.
- **Tema**: botão no header alterna claro/escuro; o atributo `data-tema` vai no elemento raiz.
  O protótipo **não persiste** a escolha. Em produção: persistir em `localStorage`, respeitar
  `prefers-color-scheme` na primeira visita e evitar o flash aplicando o tema num script
  inline no `<head>`.
- **Formulário**: no protótipo o submit apenas troca um flag e mostra a mensagem de sucesso —
  **não há backend**. Implementar de verdade: validação (nome, e-mail e descrição obrigatórios;
  e-mail com formato válido), estado de carregando no botão, estado de erro, proteção anti-spam
  (honeypot ou Turnstile) e envio para o destino escolhido (e-mail transacional, CRM ou
  webhook). Rotular erros com `aria-describedby`.
- **Responsivo**: todo o layout usa `repeat(auto-fit/auto-fill, minmax(...,1fr))` e `flex-wrap`,
  então reflui sozinho — não há breakpoints explícitos. Dois pontos a resolver na implementação:
  (a) a nav do header quebra em duas linhas em telas estreitas — trocar por menu hambúrguer
  abaixo de ~860px; (b) revisar o `padding:84px` das seções em telas pequenas (sugestão: 56px).

## State Management

Estado local, mínimo:

| Estado | Tipo | Inicial | Efeito |
|---|---|---|---|
| `tema` | `'claro' \| 'escuro'` | `'claro'` | atributo `data-tema` na raiz; troca o logo e o ícone; em produção, persistir |
| `fluxo` | 0–4 | `0` | qual fluxo do cartão do herói está em cena (`data-ativo`) |
| `etapa` | 0–6 | `0` | fase da animação do fluxo (`data-etapa`) — ver "Cartão de fluxos" |
| `enviado` | boolean | `false` | exibe a mensagem de sucesso do formulário |
| `mostrarPrecos` | boolean | `true` | exibe/oculta o bloco "sob consulta" nos três planos |
| `acento` | `'indigo' \| 'ciano' \| 'azul'` | `'indigo'` | atributo `data-acento` na raiz — descartável na implementação |

`mostrarPrecos` existia como chave de configuração do protótipo; em produção pode virar uma
flag de conteúdo ou simplesmente ser fixada em `true`.

Não há data fetching. O site é estático; a única chamada de rede é o POST do formulário.

## Assets

Todos em `assets/`, originais da identidade Alvesmaia (pasta `brand/` do cliente):

| Arquivo | Uso |
|---|---|
| `logo-indigo.svg` | **logo oficial** (navy + índigo) — tema claro, header e rodapé |
| `logo-horizontal.svg` | logo original em ciano — mantido só para comparação |
| `logo-azul.svg` | variante azul elétrico — só para comparação |
| `logo-horizontal-branco.svg` | logo em branco — tema escuro |
| `logo-simbolo.svg` / `logo-simbolo-branco.svg` | símbolo isolado (avatar, marca-d'água) |
| `logo-empilhado.svg` | versão empilhada, para espaços quadrados |
| `favicon.svg` | favicon (símbolo sobre placa navy — a placa é obrigatória) |

**Troca de logo por tema** — o protótipo renderiza os dois `<img>` e alterna por CSS
(evita requisição 404 e flash de imagem quebrada):

```css
img[data-logo]          { display: block }
img[data-logo="escuro"] { display: none }
[data-tema="escuro"] img[data-logo="escuro"] { display: block }
[data-tema="escuro"] img[data-logo="claro"]  { display: none }
```

Em React/Next, renderizar condicionalmente também resolve — mas mantenha as duas variantes
disponíveis e **nunca** aplique `filter: invert()` no logo colorido.

Como o acento também é trocável, o protótipo renderiza três `<img data-logoa="indigo|ciano|azul">`
para o tema claro e alterna por CSS. **Na implementação final, use só `logo-indigo.svg`** e o
branco no tema escuro — as outras duas variantes eram para avaliação.

> Os arquivos de acento foram gerados substituindo `#00A8E8` por `#4F6BFF` no SVG original;
> o navy e o wordmark não mudam. Os SVGs oficiais da identidade (empilhado, símbolo, favicon,
> papelaria, assinatura) **ainda estão em ciano** e precisam ser regerados em índigo pelo
> cliente antes do go-live.

**Ícones**: apenas dois, do conjunto **Lucide** (`moon`, `sun`), 17×17, `stroke-width:2`,
`stroke="currentColor"`, `fill="none"`. Se o codebase já tem uma biblioteca de ícones, use a dele.

**Fonte**: Nunito Sans via Google Fonts (`wght@400;600;700;900`). Em produção, prefira
self-host (`next/font` ou `@font-face` com `font-display:swap`).

### Regras da marca a respeitar

- O slogan **"Soluções sob medida para a sua empresa"** é texto vivo, nunca embutido no logo.
- O wordmark está em curvas: **nunca** recomponha "Alvesmaia" digitando o texto.
- O acento (hoje índigo `#4F6BFF`) não é cor de texto sobre fundo claro; use o passo escuro.
- Tamanho mínimo do logo horizontal: 140px de largura em tela.
- Não distorcer, girar, aplicar sombra ou usar a versão colorida sobre fundo colorido.

## Pendências para o cliente

1. **Preços**: os três planos exibem "sob consulta". Definir valores ou manter.
2. **CNPJ**: `00.000.000/0001-00` é placeholder.
3. **Páginas legais**: "Privacidade" e "Termos" no rodapé ainda não existem — criar ou remover.
4. **Prova social**: não há depoimentos nem cases, por decisão do cliente. Quando houver o
   primeiro caso, cabe uma seção nova entre Sobre e FAQ.
5. **Backend do formulário**: destino do envio ainda não definido.
6. **Identidade em índigo**: regerar os demais arquivos da marca (empilhado, símbolo, favicon,
   papelaria, assinatura de e-mail) e atualizar `brand/tokens.css` e `brand/paleta.json`.

## Files

| Arquivo | O que é |
|---|---|
| `Alvesmaia Site.dc.html` | protótipo completo do site (referência visual — não roda isolado) |
| `assets/*.svg` | logos e favicon oficiais, prontos para produção |

Para inspecionar medidas: abra o HTML no navegador (o layout renderiza mesmo sem o runtime
na maioria dos casos) ou leia o markup — todos os estilos são inline e literais, sem
abstrações a resolver.
