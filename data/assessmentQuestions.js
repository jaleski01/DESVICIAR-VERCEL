export const QUESTIONS = [
  {
    id: 1,
    category: "Frequência",
    title: "Tempo Gasto",
    question: "Quanto tempo, em média, você gasta por dia consumindo conteúdo adulto ou rolando feeds de redes sociais sem objetivo definido?",
    options: [
      { id: 'A', label: "Menos de 30 minutos.", score: 0 },
      { id: 'B', label: "Entre 30 minutos e 1 hora.", score: 1 },
      { id: 'C', label: "Entre 1 e 3 horas.", score: 3 },
      { id: 'D', label: "Mais de 3 horas ou perco completamente a noção do tempo.", score: 5 }
    ]
  },
  {
    id: 2,
    category: "Controle",
    title: "Acesso Automático",
    question: "Com que frequência você acessa esse tipo de conteúdo mesmo quando não tinha intenção ou vontade inicial (acesso automático)?",
    options: [
      { id: 'A', label: "Nunca, eu sempre decido conscientemente.", score: 0 },
      { id: 'B', label: "Raramente, apenas quando estou muito entediado.", score: 1 },
      { id: 'C', label: "Frequentemente, pego o celular sem pensar e já estou no site/app.", score: 3 },
      { id: 'D', label: "Sempre, é um reflexo automático assim que tenho um tempo livre.", score: 5 }
    ]
  },
  {
    id: 3,
    category: "Tolerância",
    title: "Preferências",
    question: "Sobre o tipo de conteúdo que você consome: você percebeu mudanças nas suas preferências ao longo do tempo?",
    options: [
      { id: 'A', label: "Não, continuo gostando das mesmas coisas de sempre.", score: 0 },
      { id: 'B', label: "Um pouco, às vezes preciso de algo novo para me interessar.", score: 1 },
      { id: 'C', label: "Sim, preciso de conteúdos mais específicos, intensos ou 'bizarros' para sentir excitação.", score: 3 },
      { id: 'D', label: "Sim, conteúdos normais não me causam mais nenhuma reação; preciso de extremos.", score: 5 }
    ]
  },
  {
    id: 4,
    category: "Risco",
    title: "Situações Impróprias",
    question: "Você já consumiu pornografia ou 'dopamina barata' (TikTok/Reels) em situações de risco ou impróprias?",
    options: [
      { id: 'A', label: "Nunca.", score: 0 },
      { id: 'B', label: "Já aconteceu de olhar rapidamente no trabalho/escola.", score: 1 },
      { id: 'C', label: "Sim, faço isso no trabalho, banheiros públicos ou eventos sociais.", score: 3 },
      { id: 'D', label: "Sim, inclusive em situações perigosas (dirigindo) ou arriscando meu emprego.", score: 5 }
    ]
  },
  {
    id: 5,
    category: "Impacto",
    title: "Tarefas Diárias",
    question: "Como esse hábito afeta suas tarefas diárias e responsabilidades?",
    options: [
      { id: 'A', label: "Não afeta, cumpro tudo o que planejo.", score: 0 },
      { id: 'B', label: "Às vezes procrastino, mas entrego minhas obrigações.", score: 1 },
      { id: 'C', label: "Frequentemente atraso prazos ou deixo de estudar/trabalhar para consumir.", score: 3 },
      { id: 'D', label: "Já perdi oportunidades, falhei em provas ou recebi advertências por causa disso.", score: 5 }
    ]
  },
  {
    id: 6,
    category: "Foco",
    title: "Concentração",
    question: "Como está sua capacidade de concentração em tarefas 'chatas' (leitura, relatórios, estudo) sem checar o celular?",
    options: [
      { id: 'A', label: "Consigo focar por mais de 1 hora tranquilamente.", score: 0 },
      { id: 'B', label: "Sinto vontade de checar o celular a cada 20-30 minutos.", score: 1 },
      { id: 'C', label: "É muito difícil, fico inquieto se não olhar o celular a cada 5-10 minutos.", score: 3 },
      { id: 'D', label: "Impossível, não consigo focar e sinto 'névoa mental' constante.", score: 5 }
    ]
  },
  {
    id: 7,
    category: "Gatilhos",
    title: "Momento Principal",
    question: "Qual é o principal momento ou sentimento que te leva a consumir conteúdo?",
    options: [
      { id: 'A', label: "Apenas quando tenho excitação física natural (libido alta).", score: 0 },
      { id: 'B', label: "Principalmente quando estou entediado e não tenho nada para fazer.", score: 1 },
      { id: 'C', label: "Quando estou estressado, ansioso ou tive um dia ruim (válvula de escape).", score: 3 },
      { id: 'D', label: "Quando me sinto sozinho, rejeitado ou para fugir da realidade.", score: 5 }
    ]
  },
  {
    id: 8,
    category: "Gatilhos",
    title: "Pós-Consumo",
    question: "Como você se sente imediatamente após o consumo (pós-orgasmo ou após horas no celular)?",
    options: [
      { id: 'A', label: "Satisfeito e tranquilo.", score: 0 },
      { id: 'B', label: "Indiferente, apenas volto para a rotina.", score: 1 },
      { id: 'C', label: "Com leve arrependimento ou sensação de tempo perdido.", score: 3 },
      { id: 'D', label: "Culpa intensa, vergonha, nojo de si mesmo ou vazio existencial.", score: 5 }
    ]
  },
  {
    id: 9,
    category: "Abstinência",
    title: "24 Horas Sem",
    question: "O que acontece se você tentar ficar 24 horas sem acesso a internet ou conteúdo adulto?",
    options: [
      { id: 'A', label: "Nada, seria um dia normal.", score: 0 },
      { id: 'B', label: "Sentiria falta, mas conseguiria controlar.", score: 1 },
      { id: 'C', label: "Fificaria irritado, ansioso e pensando nisso o tempo todo.", score: 3 },
      { id: 'D', label: "Teria sintomas físicos (tremedeira, suor, insônia) ou pânico.", score: 5 }
    ]
  },
  {
    id: 10,
    category: "Rotina",
    title: "Sono",
    question: "Qual a relação do seu vício com o seu sono?",
    options: [
      { id: 'A', label: "Nenhuma, durmo bem e no horário.", score: 0 },
      { id: 'B', label: "Às vezes durmo um pouco mais tarde por ficar no celular.", score: 1 },
      { id: 'C', label: "Frequentemente perco horas de sono e acordo cansado.", score: 3 },
      { id: 'D', label: "É minha rotina: só consigo dormir depois de consumir conteúdo, ou viro noites.", score: 5 }
    ]
  },
  {
    id: 11,
    category: "Rotina",
    title: "Ao Acordar",
    question: "Qual é a primeira coisa que você faz ao acordar?",
    options: [
      { id: 'A', label: "Levanto, tomo café ou faço higiene pessoal.", score: 0 },
      { id: 'B', label: "Checo mensagens importantes (WhatsApp/E-mail).", score: 1 },
      { id: 'C', label: "Abro redes sociais e rolo o feed por 10-20 minutos na cama.", score: 3 },
      { id: 'D', label: "Verifico ou consumo conteúdo adulto/estimulante antes mesmo de levantar.", score: 5 }
    ]
  },
  {
    id: 12,
    category: "Consequências",
    title: "Vida Sexual/Real",
    question: "Como o consumo digital afetou sua vida sexual real ou sua visão sobre parceiros(as)?",
    options: [
      { id: 'A', label: "Não afetou, tenho uma vida sexual satisfatória.", score: 0 },
      { id: 'B', label: "Às vezes comparo parceiros reais com o que vejo na tela.", score: 1 },
      { id: 'C', label: "Tenho menos interesse em sexo real; prefiro a tela.", score: 3 },
      { id: 'D', label: "Não consigo ter relações reais ou sinto repulsa por intimidade real.", score: 5 }
    ]
  },
  {
    id: 13,
    category: "Histórico",
    title: "Tentativas Anteriores",
    question: "Você já tentou parar antes? O que aconteceu?",
    options: [
      { id: 'A', label: "Nunca tentei ou nunca senti necessidade.", score: 0 },
      { id: 'B', label: "Já parei por um tempo sem grandes dificuldades.", score: 1 },
      { id: 'C', label: "Tentei várias vezes, mas sempre recaio após alguns dias.", score: 3 },
      { id: 'D', label: "Prometo parar toda vez que termino, mas recaio no mesmo dia ou dia seguinte.", score: 5 }
    ]
  },
  {
    id: 14,
    category: "Segredo",
    title: "Ocultação",
    question: "Você mantém segredo sobre a quantidade ou o tipo de conteúdo que consome?",
    options: [
      { id: 'A', label: "Não, não tenho nada a esconder.", score: 0 },
      { id: 'B', label: "Sou discreto, mas não é um segredo de estado.", score: 1 },
      { id: 'C', label: "Sim, ficaria muito envergonhado se alguém descobrisse meu histórico.", score: 3 },
      { id: 'D', label: "Sim, vivo uma 'vida dupla' e tenho pavor de ser descoberto.", score: 5 }
    ]
  },
  {
    id: 15,
    category: "Financeiro",
    title: "Investimento",
    question: "Você já investiu dinheiro nisso? (OnlyFans, Cams, Skins, etc)",
    options: [
      { id: 'A', label: "Nunca, só consumo conteúdo gratuito.", score: 0 },
      { id: 'B', label: "Raramente, valores baixos que não me impactam.", score: 1 },
      { id: 'C', label: "Sim, tenho gastos mensais recorrentes com isso.", score: 3 },
      { id: 'D', label: "Sim, já gastei dinheiro que precisava para contas essenciais ou me endividei.", score: 5 }
    ]
  },
  {
    id: 16,
    category: "Estratégia",
    title: "Definição de Vitória",
    variable: "victory_mode",
    question: "Ao final dos próximos 75 dias, qual resultado fará você olhar para trás e considerar que venceu o desafio?",
    options: [
      { id: 'A', label: "Modo Monge (Hard Reset)", value: 'A_MONK' },
      { id: 'B', label: "Sobriedade Focada", value: 'B_FOCUSED' },
      { id: 'C', label: "Redução de Danos", value: 'C_REDUCTION' },
      { id: 'D', label: "Reconstrução de Foco", value: 'D_REBUILD' }
    ]
  },
  {
    id: 17,
    category: "Estratégia",
    title: "Pilar de Substituição",
    variable: "focus_pillar",
    question: "O vício em dopamina barata rouba energia de outras áreas. Qual pilar da sua vida você pretende reconstruir nestes 75 dias?",
    options: [
      { id: 'A', label: "Performance Profissional/Financeira", value: 'A_WORK' },
      { id: 'B', label: "Estética e Saúde Física", value: 'B_BODY' },
      { id: 'C', label: "Relacionamentos Reais", value: 'C_LOVE' },
      { id: 'D', label: "Saúde Mental e Intelectual", value: 'D_MIND' }
    ]
  }
];