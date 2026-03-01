import { watchAuth, logout } from "/cliente/_shared/auth.js";

function toggleAccount(force){
  const drawer = document.getElementById("accountDrawer");
  if(!drawer) return;

  const shouldOpen = typeof force === "boolean"
    ? force
    : !drawer.classList.contains("open");

  drawer.classList.toggle("open", shouldOpen);
  drawer.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
  document.body.classList.toggle("no-scroll", shouldOpen);
}

function setBadge(textOrNull){
  const badge = document.getElementById("accBadge");
  if(!badge) return;
  if(textOrNull){
    badge.style.display = "grid";
    badge.textContent = String(textOrNull);
  } else {
    badge.style.display = "none";
  }
}

function renderLoggedOut(){
  const body = document.getElementById("accBody");
  const title = document.getElementById("accTitle");
  const sub = document.getElementById("accSub");

  if(title) title.textContent = "Bem-vindo";
  if(sub) sub.textContent = "Entre para acompanhar seus pedidos";
  setBadge(null);

  if(body){
    body.innerHTML = `
      <div class="acc-menu">
        <a class="acc-link" href="/cliente/login/">
          <div>
            <strong>Entrar</strong>
            <small>Acesse sua conta</small>
          </div>
          <span>→</span>
        </a>

        <a class="acc-link" href="/cliente/login/?mode=signup">
          <div>
            <strong>Criar conta</strong>
            <small>Leva menos de 1 minuto</small>
          </div>
          <span>→</span>
        </a>
      </div>
    `;
  }
}

function renderLoggedIn(user){
  const body = document.getElementById("accBody");
  const title = document.getElementById("accTitle");
  const sub = document.getElementById("accSub");

  if(title) title.textContent = "Minha conta";
  if(sub) sub.textContent = user?.email || "Conectado";

  // badge opcional (exemplo: só mostra “•” quando logado)
  setBadge("•");

  if(body){
    body.innerHTML = `
      <div class="acc-menu">
        <a class="acc-link" href="/cliente/pedidos/">
          <div>
            <strong>Meus pedidos</strong>
            <small>Acompanhe status e histórico</small>
          </div>
          <span>→</span>
        </a>

        <a class="acc-link" href="/cliente/vistos/">
          <div>
            <strong>Visto por último</strong>
            <small>Produtos que você viu</small>
          </div>
          <span>→</span>
        </a>

        <a class="acc-link" href="/cliente/config/">
          <div>
            <strong>Configurações</strong>
            <small>Dados e preferências</small>
          </div>
          <span>→</span>
        </a>

        <div class="acc-actions">
          <button class="btn btn-ghost full" id="accLogoutBtn" type="button">Sair</button>
        </div>
      </div>
    `;

    document.getElementById("accLogoutBtn")?.addEventListener("click", async () => {
      await logout();
      toggleAccount(false);
      location.href = "/";
    });
  }
}

function bind(){
  const btn = document.getElementById("accountBtn");
  btn?.addEventListener("click", () => toggleAccount(true));

  document.addEventListener("click", (e) => {
    if (e.target.closest('[data-close="account"]')) toggleAccount(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") toggleAccount(false);
  });
}

bind();

watchAuth((user) => {
  if(user) renderLoggedIn(user);
  else renderLoggedOut();
});

window.toggleAccount = toggleAccount;