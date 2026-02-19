// /js/posts.js
const basePosts = [
  {
    slug: "creatina-como-tomar",
    title: "Creatina: como tomar do jeito certo (sem enrolação)",
    excerpt: "Entenda dose, horário, consistência e os erros mais comuns que atrapalham seus resultados.",
    category: "Creatina",
    tag: "Guia",
    readTime: "5 min",
    dateISO: "2026-02-18",
    dateLabel: "18 Fev 2026",
    image: "assets/blog/creatina.jpg",
    hot: false,
    content: [
      { h2: "O básico em 1 minuto", p: "Creatina ajuda a melhorar força e desempenho em esforços curtos e intensos. O segredo é consistência diária." },
      { h2: "Dose prática", p: "3g a 5g por dia. O horário não é o que manda — manter todo dia é o que dá resultado." },
      { h2: "Erros comuns", list: ["Tomar só no dia de treino", "Parar e voltar sempre", "Não beber água o suficiente"] },
    ],
  },
  {
    slug: "whey-antes-ou-depois",
    title: "Whey: antes ou depois do treino? O que faz diferença",
    excerpt: "Quando tomar whey realmente importa? Veja a forma simples de encaixar na rotina sem paranoia.",
    category: "Proteínas",
    tag: "Popular",
    readTime: "6 min",
    dateISO: "2026-02-17",
    dateLabel: "17 Fev 2026",
    image: "assets/blog/whey.jpg",
    hot: true,
    content: [
      { h2: "O que importa", p: "O total de proteína do dia vale mais do que o minuto exato. Use whey como ferramenta de praticidade." },
      { h2: "Quando usar", list: ["Pós-treino por praticidade", "No café da manhã se você come pouco", "Entre refeições quando falta bater meta"] },
    ],
  },
  {
    slug: "pre-treino-como-usar",
    title: "Pré-treino: dose, horário e como não passar mal",
    excerpt: "Guia direto pra você sentir o efeito sem exagero: tolerância, cafeína e dicas de segurança.",
    category: "Pré-treino",
    tag: "Treino",
    readTime: "4 min",
    dateISO: "2026-02-15",
    dateLabel: "15 Fev 2026",
    image: "assets/blog/pretreino.jpg",
    hot: false,
    content: [
      { h2: "Comece baixo", p: "Se tem cafeína, comece com meia dose. Tolerância e sensibilidade variam muito." },
      { h2: "Evite tarde", p: "Pré-treino tarde pode destruir o sono e piorar recuperação." },
      { h2: "Checklist", list: ["Água", "Dose baixa", "Sono em dia", "Não misturar estimulantes"] },
    ],
  },
  {
    slug: "hipertrofia-base",
    title: "Hipertrofia: 3 pilares que valem mais que “produto mágico”",
    excerpt: "Treino consistente, proteína diária e sono. O resto é ajuste fino — aqui vai o mapa.",
    category: "Massa",
    tag: "Estratégia",
    readTime: "7 min",
    dateISO: "2026-02-12",
    dateLabel: "12 Fev 2026",
    image: "assets/blog/hipertrofia.jpg",
    hot: false,
    content: [
      { h2: "Treino", p: "Progressão e constância. O básico bem feito por meses ganha de qualquer “hack”." },
      { h2: "Nutrição", p: "Proteína + calorias suficientes. Sem isso, não tem construção muscular." },
      { h2: "Sono", p: "Recuperação é parte do treino. Dormir mal reduz performance e crescimento." },
    ],
  },
];

// extras (cards em massa)
const extraTitles = [
  ["como escolher whey", "Proteínas", "Guia"],
  ["creatina dá retenção?", "Creatina", "Mitos"],
  ["pré-treino e cafeína", "Pré-treino", "Atenção"],
  ["bulking limpo", "Massa", "Estratégia"],
  ["cutting sem perder força", "Força", "Dicas"],
  ["como ler rótulo", "Saúde", "Guia"],
];

const extras = [];
for (let i = 0; i < 20; i++) {
  const base = extraTitles[i % extraTitles.length];
  const title = `${base[0][0].toUpperCase() + base[0].slice(1)}: o que realmente importa`;

  extras.push({
    slug: `post-${i + 1}`,
    title,
    excerpt: "Conteúdo direto e prático, com foco em resultado e rotina. Sem promessa milagrosa — só o que funciona.",
    category: base[1],
    tag: base[2],
    readTime: `${4 + (i % 5)} min`,
    dateISO: `2026-02-${10 - (i % 9)}`.replace(/-(\d)$/, "-0$1"),
    dateLabel: "Fev 2026",
    image: "assets/blog/placeholder.jpg",
    hot: i % 6 === 0,
    // sem content -> artigo.js vai gerar automaticamente
  });
}

export const POSTS = [...basePosts, ...extras];
