// /js/kits-data.js
export const KITS = {
  "kit-forca-total": {
    id: "kit-forca-total",
    name: "Kit Força Total",
    price: 249,
    image: "assets/combo.png",
    oldPrice: 299,
    off: "-17%",
    desc: "Creatina + Whey para base diária e evolução consistente.",
    bullets: [
      "Creatina premium (300g)",
      "Whey protein (900g)",
      "Rotina diária simplificada",
    ],
  },

  "kit-massa-recuperacao": {
    id: "kit-massa-recuperacao",
    name: "Kit Massa e Recuperação",
    price: 279,
    image: "assets/combo.png",
    oldPrice: 339,
    off: "-18%",
    desc: "Proteína + suporte para recuperação. Ideal para consistência.",
    bullets: ["Whey premium (900g)", "Aminoácidos (uso diário)", "Recuperação + constância"],
  },

  "kit-energia-foco": {
    id: "kit-energia-foco",
    name: "Kit Energia e Foco",
    price: 219,
    image: "assets/combo.png",
    oldPrice: 269,
    off: "-19%",
    desc: "Pré-treino + suporte para sessões intensas e alta entrega.",
    bullets: ["Pré-treino (foco e energia)", "Suporte diário (rotina)", "Treinos mais intensos"],
  },
};

export function getKit(id){
  return KITS[id] || null;
}
