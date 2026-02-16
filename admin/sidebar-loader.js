import { auth } from "../js/firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

export async function loadSidebar(activeKey = "") {
  const mount = document.getElementById("sidebar");
  if (!mount) return;

  const html = await fetch("sidebar.html").then(r => r.text());
  mount.innerHTML = html;

  // active link
  if (activeKey) {
    mount.querySelectorAll(".nav a").forEach(a => {
      if (a.dataset.nav === activeKey) a.classList.add("active");
    });
  }

  
    // mobile open/close (premium)
  const panel = document.getElementById("sidebarPanel");
  const openBtn = document.getElementById("openSidebar");      // botão no MAIN
  const backdrop = document.getElementById("sidebarBackdrop"); // overlay

  function openSidebar(){
    panel?.classList.add("open");
    backdrop?.classList.add("open");
    backdrop?.setAttribute("aria-hidden","false");
    document.documentElement.style.overflow = "hidden";
  }

  function closeSidebar(){
    panel?.classList.remove("open");
    backdrop?.classList.remove("open");
    backdrop?.setAttribute("aria-hidden","true");
    document.documentElement.style.overflow = "";
  }

  openBtn?.addEventListener("click", openSidebar);
  backdrop?.addEventListener("click", closeSidebar);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSidebar();
  });

  // fecha ao clicar em um link (mobile)
  panel?.querySelectorAll(".nav a").forEach(a=>{
    a.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 1100px)").matches) closeSidebar();
    });
  });


  // auth info + logout
  const emailEl = document.getElementById("adminEmail");
  const nameEl = document.getElementById("adminName");
  const logoutBtn = document.getElementById("logoutBtn");

  onAuthStateChanged(auth, (user) => {
    if (!user) return;
    emailEl.textContent = user.email || "admin";
    nameEl.textContent = "Admin";
  });

  logoutBtn?.addEventListener("click", async () => {
    await signOut(auth);
    location.href = "login.html";
  });
}
