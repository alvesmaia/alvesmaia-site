/* ============================================================
   Alvesmaia — comportamento

   Duas coisas que o CSS não resolve sozinho: persistir a escolha de tema
   e avançar a máquina de estados do cartão de fluxos. Todo o resto —
   animação, revelação, transição — é CSS reagindo a data-tema, data-ativo
   e data-etapa. Este arquivo só troca números nesses atributos.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Tema ---------- */
  const CHAVE = "alvesmaia-tema";
  const raiz = document.documentElement;
  const botaoTema = document.getElementById("tema");

  if (botaoTema) {
    botaoTema.addEventListener("click", function () {
      const novo = raiz.dataset.tema === "escuro" ? "claro" : "escuro";
      raiz.dataset.tema = novo;
      try {
        localStorage.setItem(CHAVE, novo);
      } catch {
        // Modo privado ou storage bloqueado: o tema vale só para esta sessão.
      }
    });
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
    if (!visivel || semMovimento.matches) return;
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

  // Fora da viewport o loop não tem público: pausa e devolve a CPU.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entradas) {
      visivel = entradas[0].isIntersecting;
      if (visivel) agendar();
      else clearTimeout(timer);
    }, { threshold: 0.15 }).observe(cartao);
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
