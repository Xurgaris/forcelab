// /js/kits.js
export const KITS = [
  {
    id: "kit-forca-total",
    badge: "Oferta",
    title: "Kit Força Total",
    desc: "Creatina + Whey para base diária e evolução consistente.",
    bullets: [
      "Creatina premium (300g)",
      "Whey protein (900g)",
      "Rotina diária simplificada",
    ],
    oldPrice: 299.0,
    price: 249.0,
    offLabel: "-17%",
    images: [
      "/assets/kits/kit-forca-total-1.png", // imagem principal
      "/assets/kits/kit-forca-total-2.png",
    ],
    // itens “reais” do kit (opcional, mas MUITO bom pra carrinho/estoque)
    items: [
      { productId: "creatina-pure-300g", qty: 1 },
      { productId: "whey-concentrate-900g", qty: 1 },
    ],
  },

  {
    id: "kit-massa-recuperacao",
    badge: "Mais vendido",
    title: "Kit Massa e Recuperação",
    desc: "Proteína + suporte para recuperação. Ideal para consistência.",
    bullets: ["Whey premium (900g)", "Aminoácidos (uso diário)", "Recuperação + constância"],
    oldPrice: 339.0,
    price: 279.0,
    offLabel: "-18%",
    images: ["/assets/kits/kit-massa-1.png"],
    items: [
      { productId: "whey-premium-900g", qty: 1 },
      { productId: "amino-bcaa", qty: 1 },
    ],
  },

  {
    id: "kit-energia-foco",
    badge: "Oferta",
    title: "Kit Energia e Foco",
    desc: "Pré-treino + suporte para sessões intensas e alta entrega.",
    bullets: ["Pré-treino (foco e energia)", "Suporte diário (rotina)", "Treinos mais intensos"],
    oldPrice: 269.0,
    price: 219.0,
    offLabel: "-19%",
    images: ["/assets/kits/kit-energia-1.png"],
    items: [
      { productId: "pre-treino-focus", qty: 1 },
      { productId: "creatina-pure-300g", qty: 1 },
    ],
  },
];

export function getKitById(id){
  return KITS.find(k => k.id === id) || null;
}
