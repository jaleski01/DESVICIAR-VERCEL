import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Wrapper } from '../components/Wrapper';
import { Button } from '../components/Button';
import { COLORS, Routes, MASTER_HABITS } from '../types';
import { QUESTIONS } from '../data/assessmentQuestions';

interface Answer {
  score?: number;
  value?: string;
  label: string;
}

interface AnswersState {
  [key: number]: Answer;
}

export const OnboardingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswersState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Novo estado para seleção de hábitos
  const [showHabitSelection, setShowHabitSelection] = useState(false);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);

  const currentQuestion = QUESTIONS[currentIndex];
  const totalQuestions = QUESTIONS.length;
  const progress = showHabitSelection ? 100 : ((currentIndex + 1) / totalQuestions) * 100;

  const handleSelectOption = (option: any) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: option
    }));
  };

  const handleToggleHabit = (id: string) => {
    setSelectedHabits(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length < 6) return [...prev, id];
      return prev;
    });
  };

  const handleFinishOnboarding = async () => {
    if (!auth.currentUser) {
      alert("Erro Crítico: Usuário não autenticado.");
      navigate(Routes.LOGIN);
      return;
    }

    setIsSubmitting(true);

    try {
      let totalScore = 0;
      let victoryMode = 'INDEFINIDO';
      let focusPillar = 'INDEFINIDO';

      Object.entries(answers).forEach(([questionIdStr, val]) => {
        const questionId = parseInt(questionIdStr);
        const answer = val as Answer;
        
        if (questionId <= 15 && answer.score !== undefined) {
          totalScore += answer.score;
        }
        if (questionId === 16 && answer.value) {
          victoryMode = answer.value;
        }
        if (questionId === 17 && answer.value) {
          focusPillar = answer.value;
        }
      });

      const nowISO = new Date().toISOString();
      
      // Montagem do payload de atualização
      const userProfile = {
        onboarding_completed: true,
        current_streak_start: nowISO,
        victory_mode: victoryMode,
        focus_pillar: focusPillar,
        addiction_score: totalScore,
        selected_habits: selectedHabits, 
        email: auth.currentUser.email,
        // Auditoria e Integridade
        onboarding_completed_at: serverTimestamp(),
        last_updated: serverTimestamp()
      };

      /**
       * CORREÇÃO CRÍTICA: 
       * Adicionado { merge: true } para evitar que o setDoc sobrescreva 
       * o campo 'subscription_status' criado pelo Webhook de pagamento.
       */
      await setDoc(doc(db, "users", auth.currentUser.uid), userProfile, { merge: true });
      
      // Atualiza cache local para persistência imediata na Dashboard
      localStorage.setItem('user_profile', JSON.stringify({
        ...userProfile,
        current_streak_start: nowISO // Localmente mantemos string para o Timer
      }));
      
      navigate(Routes.DASHBOARD);

    } catch (error: any) {
      console.error("Error saving profile:", error);
      alert(`Falha ao salvar perfil: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
      const scrollContainer = document.getElementById('onboarding-scroll-container');
      if (scrollContainer) scrollContainer.scrollTo(0, 0);
    } else {
      // Após a última pergunta, move para seleção de hábitos
      setShowHabitSelection(true);
    }
  };

  const currentAnswer = answers[currentQuestion.id];

  return (
    <Wrapper noPadding>
      <div className="flex flex-col h-[100dvh] w-full bg-black overflow-hidden">
        
        {/* Header Fixo: Barra de Progresso */}
        <div className="shrink-0 px-6 pt-6 mb-4">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold" style={{ color: COLORS.Primary }}>
              {showHabitSelection ? 'ETAPA FINAL' : `QUESTÃO ${currentIndex + 1}`} 
              {!showHabitSelection && <span style={{ color: COLORS.TextSecondary }}> / {totalQuestions}</span>}
            </span>
            <span className="text-xs" style={{ color: COLORS.TextSecondary }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-1 rounded-full bg-[#1C2533]">
            <div 
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%`, backgroundColor: COLORS.Primary }}
            />
          </div>
        </div>

        {/* Área de Conteúdo Rolável */}
        <div 
          id="onboarding-scroll-container"
          className="flex-1 overflow-y-auto w-full px-6 scrollbar-hide"
        >
          {!showHabitSelection ? (
            <div className="flex flex-col pt-2 pb-40">
              <div className="mb-8">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: COLORS.Primary }}>
                  {currentQuestion.category}
                </h2>
                <h1 className="text-2xl font-bold leading-tight text-white">
                  {currentQuestion.question}
                </h1>
              </div>

              <div className="flex flex-col space-y-3 mb-8">
                {currentQuestion.options.map((option: any) => {
                  const isSelected = currentAnswer?.label === option.label;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelectOption(option)}
                      className="w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start group"
                      style={{
                        backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                        borderColor: isSelected ? COLORS.Primary : COLORS.Border,
                      }}
                    >
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 mr-4 shrink-0" style={{ borderColor: isSelected ? COLORS.Primary : COLORS.TextSecondary }}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.Primary }} />}
                      </div>
                      <span className="text-base font-medium" style={{ color: isSelected ? COLORS.TextPrimary : COLORS.TextSecondary }}>{option.label}</span>
                    </button>
                  );
                })}
              </div>

              <Button onClick={handleNext} disabled={!currentAnswer}>Próximo</Button>
            </div>
          ) : (
            // TELA DE SELEÇÃO DE HÁBITOS
            <div className="flex flex-col pt-2 pb-40">
              <div className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-2 text-violet-500">Defina seus Pilares</h2>
                <h1 className="text-2xl font-bold text-white mb-2">Seus Rituais Diários</h1>
                <p className="text-sm text-gray-400">Escolha exatamente 6 atividades que você se compromete a realizar todos os dias.</p>
                <div className="mt-4 flex items-center justify-between bg-violet-500/10 border border-violet-500/20 px-4 py-2 rounded-lg">
                  <span className="text-xs font-bold text-gray-400">Selecionados</span>
                  <span className={`text-sm font-black ${selectedHabits.length === 6 ? 'text-green-500' : 'text-violet-500'}`}>{selectedHabits.length} / 6</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {MASTER_HABITS.map((habit) => {
                  const isSelected = selectedHabits.includes(habit.id);

                  return (
                    <button
                      key={habit.id}
                      onClick={() => handleToggleHabit(habit.id)}
                      disabled={!isSelected && selectedHabits.length === 6}
                      className={`flex flex-col p-4 rounded-xl border text-left transition-all duration-200 ${isSelected ? 'border-violet-500 bg-violet-500/10' : 'border-gray-800 bg-gray-900/50 opacity-60'}`}
                    >
                       <div className="flex flex-col gap-1">
                         <span className="text-lg font-bold text-white">{habit.label}</span>
                         <span className="text-base text-white leading-relaxed">{habit.desc}</span>
                       </div>
                    </button>
                  );
                })}
              </div>

              <Button 
                onClick={handleFinishOnboarding} 
                disabled={selectedHabits.length !== 6}
                isLoading={isSubmitting}
              >
                Finalizar e Começar
              </Button>
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  );
};