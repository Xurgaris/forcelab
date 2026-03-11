(function () {
  function initHeader() {
    const dd = document.querySelector(".nav-dd");
    const btn = document.querySelector(".nav-dd-btn");
    const menu = document.querySelector(".nav-dd-menu");

    const menuBtn = document.querySelector(".menu-btn");
    const mobileMenu = document.getElementById("mobileMenu");
    const mobileClose = mobileMenu?.querySelector(".mobile-close");
    const mobileLinks = mobileMenu?.querySelectorAll(".mobile-links a");
    const mobileAccountBtn = mobileMenu?.querySelector("[data-open-account]");

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
      document.body.style.overflow = open ? "hidden" : "";

      if (open) setDropdown(false);
    }

    if (dd && btn && menu) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDropdown(!dd.classList.contains("open"));
      });

      document.addEventListener("click", (e) => {
        if (!dd.contains(e.target)) setDropdown(false);
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") setDropdown(false);
      });
    }

    menuBtn?.addEventListener("click", () => openMobile(true));
    mobileClose?.addEventListener("click", () => openMobile(false));

    mobileMenu?.addEventListener("click", (e) => {
      if (e.target === mobileMenu) openMobile(false);
    });

    mobileLinks?.forEach((link) => {
      link.addEventListener("click", () => {
        openMobile(false);
      });
    });

    mobileAccountBtn?.addEventListener("click", () => {
      openMobile(false);

      const accountBtn = document.getElementById("accountBtn");
      if (accountBtn) accountBtn.click();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") openMobile(false);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHeader);
  } else {
    initHeader();
  }
})();