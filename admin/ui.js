// admin/ui.js
function setupSidebar() {
  const btn = document.getElementById("openSidebar");
  const backdrop = document.getElementById("sidebarBackdrop");

  function open() {
    document.body.classList.add("sidebar-open");
    if (backdrop) backdrop.classList.add("open");
  }
  function close() {
    document.body.classList.remove("sidebar-open");
    if (backdrop) backdrop.classList.remove("open");
  }

  btn?.addEventListener("click", open);
  backdrop?.addEventListener("click", close);

  // fecha com ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // fecha ao clicar em um link do sidebar (melhor UX no mobile)
  document.getElementById("sidebar")?.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a && window.matchMedia("(max-width: 980px)").matches) close();
  });
}
setupSidebar();
