// ===============================
// HEADER INTERACTIONS (DOM SAFE)
// ===============================
(function () {
  function initHeader() {
    const dd = document.querySelector(".nav-dd");
    const btn = document.querySelector(".nav-dd-btn");
    const menu = document.querySelector(".nav-dd-menu");

    const searchInput = document.querySelector(".search input");

    const menuBtn = document.querySelector(".menu-btn");
    const mobileMenu = document.getElementById("mobileMenu");
    const mobileClose = mobileMenu?.querySelector(".mobile-close");
    const mobileSearch = mobileMenu?.querySelector(".mobile-search input");

    // --- Helpers ---
    function setDropdown(open) {
      if (!dd || !btn || !menu) return;
      dd.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    }

    function openMobile(open) {
      if (!menuBtn || !mobileMenu) return;
      mobileMenu.classList.toggle("open", open);
      mobileMenu.setAttribute("aria-hidden", open ? "false" : "true");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) setDropdown(false);
    }

    function applySearch(q) {
      const value = (q || "").trim();
      sessionStorage.setItem("q", value);

      // DEBUG (pra você ver no console se está disparando)
      console.log("[SEARCH] q =", value);

      location.hash = "#produtos";
      window.dispatchEvent(new Event("productSearch"));
    }

    // --- Dropdown ---
    if (dd && btn && menu) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDropdown(!dd.classList.contains("open"));
      });

      document.addEventListener("click", () => setDropdown(false));
      document.addEventListener("keydown", (e) => e.key === "Escape" && setDropdown(false));
    }

    // --- Search Desktop ---
    if (searchInput) {
      const qSaved = sessionStorage.getItem("q");
      if (qSaved) searchInput.value = qSaved;

      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          applySearch(searchInput.value);
        }
      });
    } else {
      console.warn("[SEARCH] Não achei .search input no header.");
    }

    // --- Mobile Menu ---
    menuBtn?.addEventListener("click", () => openMobile(true));
    mobileClose?.addEventListener("click", () => openMobile(false));
    mobileMenu?.addEventListener("click", (e) => e.target === mobileMenu && openMobile(false));

    // --- Search Mobile ---
    if (mobileSearch) {
      const qSaved = sessionStorage.getItem("q");
      if (qSaved) mobileSearch.value = qSaved;

      mobileSearch.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          applySearch(mobileSearch.value);
          openMobile(false);
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHeader);
  } else {
    initHeader();
  }
function openMobile(open) {
  if (!menuBtn || !mobileMenu) return;
  mobileMenu.classList.toggle("open", open);
  mobileMenu.setAttribute("aria-hidden", open ? "false" : "true");
  menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  document.body.style.overflow = open ? "hidden" : "";
  if (open) setDropdown(false);
}


document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") openMobile(false);
});

})();
