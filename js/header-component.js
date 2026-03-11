(function () {
  function buildHeader(currentPage = "home") {
    const isBlog = currentPage === "blog" || currentPage === "artigo";
    const isCatalogo = currentPage === "catalogo";

    return `
      <header class="topbar">
        <div class="container topbar-inner">
          <a class="brand" href="/index.html">
            <div class="logo">
              <h1>FORCE<span>LAB</span></h1>
              <small>Nutrition</small>
            </div>
          </a>

          <nav class="nav" aria-label="Menu principal">
            <div class="nav-dd">
              <button
                class="nav-dd-btn"
                type="button"
                aria-haspopup="true"
                aria-expanded="false"
              >
                Categorias
                <svg
                  class="chev"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
              </button>

              <div class="nav-dd-menu" role="menu" aria-label="Categorias">
                <a role="menuitem" href="/catalogo.html?tag=forca">Força</a>
                <a role="menuitem" href="/catalogo.html?tag=energia">Energia</a>
                <a role="menuitem" href="/catalogo.html?tag=massa">Massa</a>
                <a role="menuitem" href="/catalogo.html?tag=saude">Saúde</a>
                <div class="sep"></div>
                <a role="menuitem" href="/catalogo.html">Ver catálogo completo</a>
              </div>
            </div>

            <a href="/catalogo.html" class="${isCatalogo ? "active" : ""}">Catálogo</a>
            <a href="/catalogo.html?tag=creatina">Creatina</a>
            <a href="/catalogo.html?tag=proteinas">Proteínas</a>
            <a href="/catalogo.html?tag=pre-treino">Pré-Treino</a>
            <a href="/index.html#kits">Kits</a>
            <a href="/blog.html" class="${isBlog ? "active" : ""}">Blog</a>
          </nav>

          <button
            id="accountBtn"
            class="nav-account nav-account-desktop"
            type="button"
            aria-label="Conta"
            aria-haspopup="true"
          >
            <svg
              class="acc-ico"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2-8 4.5V21h16v-2.5C20 16 16.42 14 12 14Z"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linejoin="round"
              />
            </svg>

            <span
              id="accBadge"
              class="acc-badge"
              aria-hidden="true"
              style="display:none"
            >!</span>
          </button>

          <div class="topbar-actions">
            <button
              class="menu-btn"
              id="menuBtn"
              type="button"
              aria-label="Abrir menu"
              aria-controls="mobileMenu"
              aria-expanded="false"
            >
              <span class="sr-only">Abrir menu</span>
            </button>

            <button
              class="cart-ico-btn"
              type="button"
              aria-label="Abrir carrinho"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M6 6h15l-2 9H7L6 6z"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linejoin="round"
                />
                <path
                  d="M6 6L5 3H2"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <path
                  d="M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                />
              </svg>

              <span class="cart-count-pill">
                (<span id="cartCount">0</span>)
              </span>
            </button>
          </div>
        </div>
      </header>

      <div id="mobileMenu" class="mobile-menu" aria-hidden="true">
        <div class="mobile-menu-inner" role="dialog" aria-label="Menu mobile">
          <div class="mobile-menu-top">
            <strong>Menu</strong>

            <button
              class="mobile-top-account nav-account"
              type="button"
              aria-label="Abrir minha conta"
              data-open-account
            >
              <svg
                class="acc-ico"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2-8 4.5V21h16v-2.5C20 16 16.42 14 12 14Z"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linejoin="round"
                />
              </svg>
            </button>

            <button class="mobile-close" type="button" aria-label="Fechar menu">
              ✖
            </button>
          </div>

          <nav class="mobile-links" aria-label="Links do menu mobile">
            <a href="/catalogo.html">Categorias</a>
            <a href="/catalogo.html?tag=creatina">Creatina</a>
            <a href="/catalogo.html?tag=proteinas">Proteínas</a>
            <a href="/catalogo.html?tag=pre-treino">Pré-Treino</a>
            <a href="/index.html#kits">Kits</a>
            <a href="/blog.html">Blog</a>
            <a href="/index.html#contato">Contato</a>
          </nav>
        </div>
      </div>

      <div
        id="cartOverlay"
        class="cart-overlay"
        aria-hidden="true"
        onclick="toggleCart(false)"
      ></div>

      <div id="miniCart" class="mini-cart" aria-label="Carrinho lateral">
        <div class="cart-header">
          <h3>Seu carrinho</h3>
          <button class="close-cart" onclick="toggleCart(false)">Fechar</button>
        </div>

        <div id="miniCartItems" class="mini-items"></div>

        <div class="cart-footer">
          <p>Total</p>
          <h2>R$ <span id="miniTotal">0</span></h2>

          <a href="/cart.html" class="btn btn-primary full">Ver carrinho</a>
          <a href="/checkout.html" class="btn btn-ghost full">Finalizar pedido</a>
        </div>
      </div>

      <div id="accountDrawer" class="acc-drawer" aria-hidden="true">
        <div class="acc-overlay" data-close="account" aria-hidden="true"></div>

        <aside class="acc-panel" role="dialog" aria-label="Conta">
          <header class="acc-head">
            <div class="acc-user">
              <div class="acc-avatar" aria-hidden="true">👤</div>
              <div>
                <button id="accTitle">Minha conta</button>
                <small id="accSub" class="muted">
                  Entrar para acompanhar pedidos
                </small>
              </div>
            </div>

            <button class="btn-mini ghost" type="button" data-close="account">
              Fechar
            </button>
          </header>

          <div class="acc-body" id="accBody"></div>
        </aside>
      </div>
    `;
  }

  function initSharedHeader() {
    const mount = document.getElementById("siteHeaderMount");
    if (!mount) return;

    const currentPage = document.body.dataset.page || "home";
    mount.innerHTML = buildHeader(currentPage);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSharedHeader);
  } else {
    initSharedHeader();
  }
})();