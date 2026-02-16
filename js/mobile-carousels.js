// Clona os cards do Desktop para os carrosséis Mobile (sem duplicar HTML)
(function () {
  const pairs = [
    { from: "#objGrid", to: "#objCarousel" },     // objetivos
    { from: "#kitsGrid", to: "#kitsCarousel" },   // kits
    { from: "#revGrid", to: "#revCarousel" },     // comentários
  ];

  const isMobile = () => window.matchMedia("(max-width: 760px)").matches;

  function fill() {
    pairs.forEach(({ from, to }) => {
      const src = document.querySelector(from);
      const dst = document.querySelector(to);
      if (!src || !dst) return;

      // limpa e repopula somente no mobile
      if (!isMobile()) {
        dst.innerHTML = "";
        return;
      }

      // se já tem conteúdo, não duplica
      if (dst.dataset.filled === "1") return;

      const clones = Array.from(src.children).map((node) => node.cloneNode(true));

      dst.innerHTML = "";
      clones.forEach((c) => dst.appendChild(c));
      dst.dataset.filled = "1";
    });
  }

  // primeira carga
  window.addEventListener("DOMContentLoaded", fill);

  // se redimensionar (desktop <-> mobile)
  window.addEventListener("resize", () => {
    // reseta pra poder preencher de novo ao voltar pro mobile
    pairs.forEach(({ to }) => {
      const dst = document.querySelector(to);
      if (dst) dst.dataset.filled = "0";
    });
    fill();
  });
})();
