// /js/blogData.js
export const POSTS = [
  {
    id: "pre-treino-rotina-intensa",
    tag: "Guia",
    category: "Performance",
    title: "Como escolher pré-treino para rotina intensa",
    excerpt: "Pontos-chave para comparar fórmulas e ajustar por tolerância.",
    cover: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1400&q=80",
    date: "2026-02-18",
    views: 420,
    readingMinutes: 5,
    content: [
      { h2: "O que um pré-treino precisa entregar", p: "Foco, energia e consistência. O segredo é evitar exageros e ajustar pela tolerância." },
      { h2: "Cafeína: dose e timing", p: "Se você treina tarde, reduza a dose ou use versões mais leves para não atrapalhar o sono." },
      { h2: "Quando faz sentido usar", p: "Dias de treino pesado, baixa energia ou quando a rotina está instável." }
    ]
  },

  {
    id: "whey-base-diaria",
    tag: "Performance",
    category: "Rotina",
    title: "Whey: base diária para recuperação e consistência",
    excerpt: "Quando usar, como encaixar e como comparar opções com clareza.",
    cover: "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=1400&q=80",
    date: "2026-02-16",
    views: 980,
    readingMinutes: 6,
    content: [
      { h2: "O papel do whey na rotina", p: "Whey não é mágica. É praticidade para bater proteína com consistência." },
      { h2: "Concentrado vs isolado", p: "Concentrado costuma ter melhor custo-benefício. Isolado ajuda quem tem mais sensibilidade." },
      { h2: "Dica prática", p: "Use após treino ou em lanches quando faltar proteína no dia." }
    ]
  },

  {
    id: "creatina-uso-diario",
    tag: "Rotina",
    category: "Consistência",
    title: "Creatina: o que muda com uso diário",
    excerpt: "Estratégia, consistência e como acompanhar evolução ao longo do tempo.",
    cover: "https://images.unsplash.com/photo-1615485737651-5808f36a92b1?auto=format&fit=crop&w=1400&q=80",
    date: "2026-02-10",
    views: 710,
    readingMinutes: 5,
    content: [
      { h2: "O básico que funciona", p: "3 a 5g por dia. O que importa é regularidade." },
      { h2: "Quando você percebe", p: "Geralmente após 2 a 4 semanas. Mais força, volume e consistência." },
      { h2: "Erros comuns", p: "Tomar só nos dias de treino, parar por “não sentir”, ou complicar demais." }
    ]
  }
];

export function getPostById(id){
  return POSTS.find(p => p.id === id) || null;
}
