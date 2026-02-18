import { getKit } from "./kits-data.js";

function goCart(){
  window.location.href = "./cart.html"; // ✅ caminho absoluto
}

function setupKits(root){
  if (!root) return;

  root.addEventListener("click", (e) => {
    const addBtn = e.target.closest(".kit-btn");
    const card = e.target.closest(".kit-card");
    if (!addBtn || !card) return;

    const kitId = card.getAttribute("data-kit");
    const kit = getKit(kitId);
    if (!kit) return;

    addToCartQty(kit.name, kit.price, kit.image, 1, { type: "kit", id: kit.id });
    goCart();
  });
}

setupKits(document.getElementById("kitsGrid"));
setupKits(document.getElementById("kitsCarousel"));
