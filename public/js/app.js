/* ============================================================
   Alvesmaia — comportamento

   O que o CSS não resolve sozinho: persistir a escolha de tema, avançar a
   máquina de estados do cartão de fluxos, fechar o menu ao navegar e
   anunciar o resultado do formulário. Todo o resto — animação, revelação,
   transição — é CSS reagindo a data-tema, data-ativo e data-etapa. Este
   arquivo só troca números e atributos.
   ============================================================ */
(function () {
  "use strict";

  const raiz = document.documentElement;

  /* ---------- Tema ---------- */
  const CHAVE = "alvesmaia-tema";
  const botaoTema = document.getElementById("tema");

  // O widget do Turnstile nasce em `auto`, que segue o prefers-color-scheme
  // do sistema — não o tema que este botão controla. Sem sincronizar, quem
  // usa o site no escuro com o sistema no claro vê um retângulo branco de
  // 300x65 no meio do formulário.
  function sincronizarTurnstile(tema) {
    const w = document.querySelector(".cf-turnstile");
    if (w) w.dataset.theme = tema === "escuro" ? "dark" : "light";
  }
  sincronizarTurnstile(raiz.dataset.tema);

  if (botaoTema) {
    botaoTema.addEventListener("click", function () {
      const novo = raiz.dataset.tema === "escuro" ? "claro" : "escuro";
      raiz.dataset.tema = novo;
      sincronizarTurnstile(novo);
      try {
        localStorage.setItem(CHAVE, novo);
      } catch {
        // Modo privado ou storage bloqueado: o tema vale só para esta sessão.
      }
    });
  }

  /* ---------- Menu ---------- */
  // O checkbox continua sendo o estado que o CSS lê; o rótulo é o controle
  // que a pessoa vê e o leitor de tela anuncia. Aqui os dois ficam de acordo.
  const alternador = document.getElementById("nav-toggle");
  const hamburguer = document.querySelector(".nav-hamburguer");
  const navegacao = document.getElementById("nav-principal");

  if (alternador && hamburguer && navegacao) {
    function pintarMenu() {
      hamburguer.setAttribute("aria-expanded", String(alternador.checked));
      hamburguer.setAttribute(
        "aria-label",
        alternador.checked ? "Fechar menu de navegação" : "Abrir menu de navegação",
      );
    }

    // Um <label> abre o checkbox no clique, mas não no Enter: com role=button
    // a pessoa espera que Enter e Espaço funcionem.
    hamburguer.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      alternador.checked = !alternador.checked;
      pintarMenu();
    });

    alternador.addEventListener("change", pintarMenu);

    // Sem isto o menu fica aberto depois do clique e cobre a seção de
    // destino: o scroll-margin-top foi calibrado para o header fechado.
    navegacao.addEventListener("click", function (e) {
      if (!e.target.closest("a")) return;
      alternador.checked = false;
      pintarMenu();
    });

    pintarMenu();
  }

  /* ---------- Avisos do formulário ---------- */
  // Os três avisos já existem no DOM na carga e o :target os revela depois
  // do 303 da API. Uma live region que já estava presente no load não
  // dispara anúncio nenhum — não há mutação.
  //
  // A mutação precisa acontecer em um elemento SEM pegada de layout. Mexer
  // no texto do aviso visível fazia a página rolar sozinha: o elemento
  // colapsava, o conteúdo abaixo subia, e ao restaurar descia de volta.
  const aviso = location.hash && document.querySelector(location.hash + ".aviso");
  const anuncio = document.getElementById("anuncio");
  if (aviso && anuncio) {
    // Um quadro de atraso: preencher durante a carga não conta como mutação
    // para o leitor de tela, que ainda está montando a árvore.
    requestAnimationFrame(function () {
      anuncio.textContent = aviso.textContent.trim();
    });
  }

  /* ---------- Envio do formulário ---------- */
  // Camada sobre o POST nativo, não substituição dele: sem JavaScript o
  // formulário continua funcionando pelo 303 e pelo :target. Com
  // JavaScript, o envio acontece sem recarregar — e o que a pessoa
  // escreveu não se perde quando algo falha.
  const formulario = document.querySelector(".form");
  if (formulario && window.fetch && window.FormData) {
    const botao = formulario.querySelector("button[type=submit]");
    const rotuloOriginal = botao ? botao.textContent : "";
    let enviando = false;

    function mostrarAviso(qual) {
      // Os avisos são revelados por :target no CSS. Sem recarregar a página
      // o :target não muda sozinho, então o hash é ajustado na mão.
      if (location.hash !== "#" + qual) {
        history.replaceState(null, "", "#" + qual);
      }
      // replaceState não redispara :target; forçar o recálculo é o que faz
      // o aviso aparecer.
      const alvo = document.getElementById(qual);
      if (alvo) {
        alvo.classList.add("aviso--visivel");
        for (const outro of document.querySelectorAll(".aviso")) {
          if (outro !== alvo) outro.classList.remove("aviso--visivel");
        }
        if (anuncio) anuncio.textContent = alvo.textContent.trim();
        alvo.scrollIntoView({ block: "nearest" });
      }
    }

    formulario.addEventListener("submit", async function (e) {
      if (enviando) {
        e.preventDefault();
        return;
      }
      // Deixa a validação nativa agir primeiro; só assume se ela passou.
      if (!formulario.checkValidity()) return;

      e.preventDefault();
      enviando = true;
      if (botao) {
        botao.disabled = true;
        botao.textContent = "Enviando...";
      }

      let resultado = "erro";
      try {
        const r = await fetch(formulario.action, {
          method: "POST",
          body: new FormData(formulario),
          headers: { Accept: "application/json" },
        });
        const corpo = await r.json();
        resultado = corpo.resultado || "erro";
      } catch {
        // Rede caiu no meio. O texto continua na tela, que é o ponto.
        resultado = "erro";
      }

      enviando = false;
      if (botao) {
        botao.disabled = false;
        botao.textContent = rotuloOriginal;
      }

      if (resultado === "enviado") {
        formulario.reset();
      }
      // O token do Turnstile é de uso único: sem reiniciar o widget, a
      // segunda tentativa falha sozinha por token repetido.
      if (window.turnstile && typeof window.turnstile.reset === "function") {
        try {
          window.turnstile.reset();
        } catch {
          // Widget ainda não montado: nada a reiniciar.
        }
      }
      mostrarAviso(resultado);
    });
  }

  /* ---------- Botão flutuante ---------- */
  // Ele existe para levar ao formulário. Uma vez que o formulário está na
  // tela, deixa de ter função e passa a cobrir justamente o que a pessoa
  // veio ver — inclusive o próprio botão de enviar.
  const flutuante = document.querySelector("[data-flutuante]");
  const secaoContato = document.getElementById("contato");
  const acoesDoHero = document.querySelector(".hero__acoes");

  if (flutuante && "IntersectionObserver" in window) {
    // Dois motivos para sumir, e ambos são o mesmo motivo: já existe na
    // tela um caminho para o contato. No topo são os botões do hero — sem
    // isto o flutuante vira um terceiro botão empilhado logo abaixo deles.
    // No fim é o próprio formulário, que ele cobriria.
    const concorrentes = [acoesDoHero, secaoContato].filter(Boolean);
    const naTela = new Set();

    const observador = new IntersectionObserver(
      function (entradas) {
        for (const e of entradas) {
          if (e.isIntersecting) naTela.add(e.target);
          else naTela.delete(e.target);
        }
        flutuante.dataset.oculto = naTela.size > 0 ? "sim" : "nao";
      },
      { threshold: 0.12 },
    );
    for (const alvo of concorrentes) observador.observe(alvo);

    // Nasce escondido: a página abre no hero, onde ele não deve aparecer.
    flutuante.dataset.oculto = "sim";
  }

  /* ---------- Cartão de fluxos ---------- */
  const cartao = document.querySelector(".fluxos");
  if (!cartao) return;

  const TOTAL_FLUXOS = cartao.querySelectorAll("[data-fluxo]").length;
  if (!TOTAL_FLUXOS) return;

  const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");

  let fluxo = 0;
  let etapa = 0;
  let timer = null;
  let visivel = true;
  let pausado = false;

  function pintar() {
    cartao.dataset.ativo = String(fluxo);
    cartao.dataset.etapa = String(etapa);
  }

  // Durações do handoff. A etapa 5 é a mais longa de propósito: é onde o
  // selo de concluído aparece, e é o quadro que vale ser lido.
  function espera(e) {
    if (e === 0) return 900;
    if (e < 4) return 1700;
    if (e === 4) return 1300;
    if (e === 5) return 2800;
    return 480;
  }

  function agendar() {
    clearTimeout(timer);
    if (pausado || !visivel || semMovimento.matches) return;
    // Reagendar sempre dentro do próprio timer: fazê-lo em resposta à
    // mudança de estado trava a animação na primeira etapa.
    timer = setTimeout(function () {
      if (etapa >= 6) {
        fluxo = (fluxo + 1) % TOTAL_FLUXOS;
        etapa = 0;
      } else {
        etapa += 1;
      }
      pintar();
      agendar();
    }, espera(etapa));
  }

  function irPara(indice) {
    fluxo = (indice + TOTAL_FLUXOS) % TOTAL_FLUXOS;
    etapa = 0;
    pintar();
    agendar();
  }

  /**
   * A seta assume o controle: escolher um fluxo à mão encerra a rotação
   * automática, e ela não volta.
   *
   * Esse é o mecanismo que atende a WCAG 2.2.2 (nível A) desde que o botão
   * dedicado de pausa saiu. É mais fraco que o botão — não se anuncia como
   * "pausar" —, mas continua sendo um controle de teclado que para o
   * movimento, e é o único que sobrou.
   */
  Array.prototype.forEach.call(
    cartao.querySelectorAll("[data-passo-fluxo]"),
    function (botao) {
      botao.addEventListener("click", function () {
        pausado = true;
        // A animação é CSS; o atributo é o que o CSS lê para congelá-la.
        cartao.dataset.pausado = "true";
        irPara(fluxo + Number(botao.dataset.passoFluxo));
      });
    },
  );

  // Fora da viewport o loop não tem público: pausa e devolve a CPU.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entradas) {
        visivel = entradas[0].isIntersecting;
        cartao.dataset.visivel = String(visivel);
        if (visivel) agendar();
        else clearTimeout(timer);
      },
      { threshold: 0.15 },
    ).observe(cartao);
  }

  // Quem pediu movimento reduzido vê o fluxo completo e parado; o CSS
  // cuida da aparência, aqui só não se agenda nada.
  if (semMovimento.addEventListener) {
    semMovimento.addEventListener("change", function () {
      if (semMovimento.matches) clearTimeout(timer);
      else agendar();
    });
  }

  pintar();
  agendar();
})();
