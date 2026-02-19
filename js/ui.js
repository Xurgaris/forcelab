// /js/ui.js
(function () {
  // Helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ==========================
  // MOBILE MENU
  // ==========================
  const menuBtn = $("#menuBtn");
  const mobileMenu = $("#mobileMenu");

  function openMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add("open");
    mobileMenu.setAttribute("aria-hidden", "false");
    menuBtn?.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
  }

  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove("open");
    mobileMenu.setAttribute("aria-hidden", "true");
    menuBtn?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  }

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.contains("open");
      isOpen ? closeMenu() : openMenu();
    });

    // qualquer elemento com data-close="menu" fecha
    $$('[data-close="menu"]', mobileMenu).forEach((el) => {
      el.addEventListener("click", closeMenu);
    });
  }

  // ==========================
  // DROPDOWN: CATEGORIAS
  // ==========================
  const dd = $(".nav-dd");
  const ddBtn = $(".nav-dd-btn", dd || document);
  const ddMenu = $(".nav-dd-menu", dd || document);

  function openDD() {
    if (!dd || !ddBtn || !ddMenu) return;
    dd.classList.add("open");
    ddBtn.setAttribute("aria-expanded", "true");
  }

  function closeDD() {
    if (!dd || !ddBtn || !ddMenu) return;
    dd.classList.remove("open");
    ddBtn.setAttribute("aria-expanded", "false");
  }

  if (dd && ddBtn && ddMenu) {
    ddBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dd.classList.contains("open") ? closeDD() : openDD();
    });

    // fecha ao clicar fora
    document.addEventListener("click", (e) => {
      if (!dd.contains(e.target)) closeDD();
    });

    // fecha ao clicar em um link do menu
    $$("a", ddMenu).forEach((a) => a.addEventListener("click", closeDD));
  }

  // ==========================
  // ESC fecha tudo
  // ==========================
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeMenu();
    closeDD();
  });
})();
