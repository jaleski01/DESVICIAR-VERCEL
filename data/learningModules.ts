export interface LearningStep {
  text: string;
  isCopyable?: boolean;
  copyValue?: string;
}

export interface LearningModule {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  icon: string;
  intro?: string;
  
  // Design System Properties
  gradientStart: string;
  gradientEnd: string;
  accentColor: string;

  // Content (Optional for now, primarily for the DNS tutorial)
  androidSteps?: LearningStep[];
  iosSteps?: LearningStep[];
}

export const LEARNING_MODULES: LearningModule[] = [
  // --- BLOQUEIO TÉCNICO (Updated: Purple Neon Theme) ---
  {
    id: 'dns_shield',
    title: 'O Escudo Invisível (DNS)',
    subtitle: 'Bloqueio de conteúdo adulto na raiz da rede.',
    category: 'Bloqueio Técnico',
    icon: 'shield',
    gradientStart: '#0B101A',
    gradientEnd: '#112240',
    accentColor: '#A78BFA', // Lilac/Cyan substitute
    intro: 'O DNS Family da Cloudflare bloqueia requisições a sites adultos na raiz da rede. É uma camada de segurança invisível, gratuita e que não exige a instalação de aplicativos pesados.',
    androidSteps: [
      { text: 'Abra as Configurações do seu Android.' },
      { text: 'Vá em "Rede e Internet" ou "Conexões".' },
      { text: 'Toque em "DNS Privado" (ou pesquise por "DNS" na lupa de configurações).' },
      { text: 'Selecione a opção "Nome do host do provedor de DNS privado".' },
      { text: 'Digite exatamente o endereço abaixo:', isCopyable: false },
      { text: 'family.cloudflare-dns.com', isCopyable: true, copyValue: 'family.cloudflare-dns.com' },
      { text: 'Toque em Salvar. Se a internet desconectar, verifique se digitou corretamente.' }
    ],
    iosSteps: [
      { text: 'Abra os Ajustes e toque em "Wi-Fi".' },
      { text: 'Toque no ícone (i) azul ao lado da rede conectada.' },
      { text: 'Role até o final e toque em "Configurar DNS".' },
      { text: 'Mude de "Automático" para "Manual".' },
      { text: 'Apague os servidores existentes (botão vermelho).' },
      { text: 'Toque em (+) Adicionar Servidor e digite:', isCopyable: false },
      { text: '1.1.1.3', isCopyable: true, copyValue: '1.1.1.3' },
      { text: 'Toque em (+) novamente e adicione o secundário:', isCopyable: false },
      { text: '1.0.0.3', isCopyable: true, copyValue: '1.0.0.3' },
      { text: 'Toque em "Salvar" no canto superior direito.' }
    ]
  },

  // --- CATEGORIA: ARTIGOS (Black/Grey Gradient) ---
  {
    id: 'art_coolidge',
    title: 'O Efeito Coolidge',
    subtitle: 'Por que seu cérebro exige novidade constante.',
    category: 'ARTIGOS',
    icon: 'document',
    gradientStart: '#000000',
    gradientEnd: '#1F2937',
    accentColor: '#9CA3AF', // Grey
    intro: 'O efeito Coolidge é um fenômeno biológico visto em quase todas as espécies de mamíferos, onde os machos exibem um desejo sexual renovado sempre que uma nova fêmea é introduzida, mesmo após a exaustão sexual com parceiros anteriores.'
  },
  {
    id: 'art_dopa',
    title: 'Dessensibilização Dopaminérgica',
    subtitle: 'A biologia por trás da perda de prazer em coisas reais.',
    category: 'ARTIGOS',
    icon: 'document',
    gradientStart: '#000000',
    gradientEnd: '#1F2937',
    accentColor: '#9CA3AF',
    intro: 'O excesso de estímulos supranormais causa uma regulação negativa (downregulation) nos receptores D2. O resultado é a anedonia: a incapacidade de sentir prazer nas atividades cotidianas sutis.'
  },
  {
    id: 'art_libido',
    title: 'O Mito da Libido',
    subtitle: 'Diferenciando vontade sexual real de fissura química.',
    category: 'ARTIGOS',
    icon: 'document',
    gradientStart: '#000000',
    gradientEnd: '#1F2937',
    accentColor: '#9CA3AF',
    intro: 'Muitas vezes, o que interpretamos como "alta libido" é na verdade o sistema de recompensa do cérebro gritando por uma dose de dopamina para aliviar o estresse ou o tédio, não uma necessidade sexual biológica genuína.'
  },

  // --- CATEGORIA: PODCASTS (Deep Purple Gradient) ---
  {
    id: 'pod_rescue',
    title: 'Protocolo de Resgate: Dia 1',
    subtitle: 'O que fazer nas primeiras 24h de abstinência.',
    category: 'PODCASTS',
    icon: 'mic',
    gradientStart: '#0F0A15',
    gradientEnd: '#2E1065',
    accentColor: '#8B5CF6', // Purple
    intro: 'Um guia de áudio passo a passo para sobreviver às primeiras e mais difíceis 24 horas. Foco em hidratação, exercício intenso e remoção de gatilhos ambientais.'
  },
  {
    id: 'pod_interview',
    title: 'Entrevista: Cérebro vs. Pornografia',
    subtitle: 'Neurocientistas explicam o encolhimento do córtex.',
    category: 'PODCASTS',
    icon: 'mic',
    gradientStart: '#0F0A15',
    gradientEnd: '#2E1065',
    accentColor: '#8B5CF6',
    intro: 'Uma discussão profunda sobre os estudos que mostram a redução de massa cinzenta no córtex pré-frontal em usuários crônicos e como a neuroplasticidade permite a reversão desse quadro.'
  },

  // --- CATEGORIA: VÍDEOS (Lilac/Teal) ---
  {
    id: 'vid_huberman',
    title: 'Huberman: Controle de Impulso',
    subtitle: 'Ferramentas visuais para parar a recaída.',
    category: 'VÍDEOS',
    icon: 'play',
    gradientStart: '#0B101A',
    gradientEnd: '#112240',
    accentColor: '#A78BFA', // Lilac
    intro: 'Dr. Andrew Huberman explica mecanismos visuais, como o foco panorâmico vs. foco focal, para desativar o sistema de alerta do cérebro e reduzir a impulsividade no momento do gatilho.'
  },
  {
    id: 'vid_habit',
    title: 'Anatomia do Hábito',
    subtitle: 'Como quebrar o loop Gatilho-Ação-Recompensa.',
    category: 'VÍDEOS',
    icon: 'play',
    gradientStart: '#0B101A',
    gradientEnd: '#112240',
    accentColor: '#A78BFA',
    intro: 'Uma análise visual do Loop do Hábito de Charles Duhigg. Aprenda que você não elimina um hábito, você o substitui mantendo o gatilho e a recompensa, mas alterando a rotina.'
  }
];