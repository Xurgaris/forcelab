import { auth } from "../js/firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

export async function loadSidebar(activeKey = "") {
  const mount = document.getElementById("sidebar");
  if (!mount) return;

  const html = await fetch("/admin/sidebar.html").then((r) => r.text());
  mount.innerHTML = html;

  const panel = document.getElementById("sidebarPanel");
  const openBtn = document.getElementById("openSidebar");
  const backdrop = document.getElementById("sidebarBackdrop");

  function isMobileSidebar() {
    return window.matchMedia("(max-width: 1100px)").matches;
  }

  function openSidebar() {
    document.body.classList.add("sidebar-open");
    panel?.classList.add("open");
    backdrop?.classList.add("open");
    backdrop?.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
  }

  function closeSidebar() {
    document.body.classList.remove("sidebar-open");
    panel?.classList.remove("open");
    backdrop?.classList.remove("open");
    backdrop?.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
  }

  // marca link ativo
  if (activeKey) {
    mount.querySelectorAll(".side-nav a").forEach((a) => {
      if (a.dataset.nav === activeKey) {
        a.classList.add("active");
      }
    });
  }

  // abrir / fechar
  openBtn?.addEventListener("click", openSidebar);
  backdrop?.addEventListener("click", closeSidebar);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSidebar();
  });

  // fecha ao clicar em link no mobile
  panel?.querySelectorAll(".side-nav a").forEach((a) => {
    a.addEventListener("click", () => {
      if (isMobileSidebar()) closeSidebar();
    });
  });

  // se voltar para desktop, limpa estado mobile
  window.addEventListener("resize", () => {
    if (!isMobileSidebar()) closeSidebar();
  });

  // auth info + logout
  const emailEl = document.getElementById("adminEmail");
  const nameEl = document.getElementById("adminName");
  const logoutBtn = document.getElementById("logoutBtn");

  onAuthStateChanged(auth, (user) => {
    if (!user) return;
    if (emailEl) emailEl.textContent = user.email || "admin";
    if (nameEl) nameEl.textContent = "Admin";
  });

  logoutBtn?.addEventListener("click", async () => {
    await signOut(auth);
    location.href = "/admin/login.html";
  });
}