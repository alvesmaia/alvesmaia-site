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
  // dispara anúncio nenhum — não há mutação. Reinserir o texto cria a
  // mutação que o leitor de tela precisa para falar.
  const aviso = location.hash && document.querySelector(location.hash + ".aviso");
  if (aviso) {
    const texto = aviso.textContent;
    aviso.textContent = "";
    setTimeout(function () {
      aviso.textContent = texto;
    }, 120);
  }

  /* ---------- Cartão de fluxos ---------- */
  const cartao = document.querySelector(".fluxos");
  if (!cartao) return;

  const TOTAL_FLUXOS = cartao.querySelectorAll("[data-fluxo]").length;
  if (!TOTAL_FLUXOS) return;

  const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");
  const botaoPausa = document.getElementById("fluxos-pausa");

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

  Array.prototype.forEach.call(
    cartao.querySelectorAll("[data-passo-fluxo]"),
    function (botao) {
      botao.addEventListener("click", function () {
        irPara(fluxo + Number(botao.dataset.passoFluxo));
      });
    },
  );

  // As setas avançam e reiniciam o timer — nenhuma delas para o movimento.
  // WCAG 2.2.2, nível A, exige uma forma de pausar o que se move sozinho.
  if (botaoPausa) {
    botaoPausa.addEventListener("click", function () {
      pausado = !pausado;
      botaoPausa.setAttribute("aria-pressed", String(pausado));
      botaoPausa.setAttribute(
        "aria-label",
        pausado ? "Retomar a rotação dos fluxos" : "Pausar a rotação dos fluxos",
      );
      // A animação é CSS; o atributo é o que o CSS lê para congelá-la.
      cartao.dataset.pausado = String(pausado);
      if (pausado) clearTimeout(timer);
      else agendar();
    });
  }

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
