import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrapper } from '../components/Wrapper';
import { Button } from '../components/Button';
import { COLORS, Routes } from '../types';

export const SosScreen: React.FC = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [showExitButton, setShowExitButton] = useState(false);
  const [scale, setScale] = useState(1);
  
  // Refs for timing to prevent memory leaks
  const cycleIntervalRef = useRef<any>(null);
  const exitTimeoutRef = useRef<any>(null);
  const holdTimeoutRef = useRef<any>(null);
  const exhaleTimeoutRef = useRef<any>(null);

  useEffect(() => {
    // 1. Safety Lock: Enable exit button after 10 seconds
    exitTimeoutRef.current = setTimeout(() => {
      setShowExitButton(true);
    }, 10000);

    // 2. Breathing Logic (4-4-4 Cycle)
    const runCycle = () => {
      // PHASE 1: INHALE (4 Seconds)
      setPhase('inhale');
      // Reduced scale from 1.5 to 1.3 to prevent overlapping
      setScale(1.3); 
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(100); // Haptic feedback at start
      }

      holdTimeoutRef.current = setTimeout(() => {
        // PHASE 2: HOLD (4 Seconds)
        setPhase('hold');
        // Scale stays at 1.3
        
        exhaleTimeoutRef.current = setTimeout(() => {
          // PHASE 3: EXHALE (4 Seconds)
          setPhase('exhale');
          setScale(1.0); // Shrink
        }, 4000);

      }, 4000);
    };

    // Run immediately
    runCycle();

    // Repeat every 12 seconds (4 + 4 + 4)
    cycleIntervalRef.current = setInterval(runCycle, 12000);

    return () => {
      clearTimeout(exitTimeoutRef.current);
      clearTimeout(holdTimeoutRef.current);
      clearTimeout(exhaleTimeoutRef.current);
      clearInterval(cycleIntervalRef.current);
    };
  }, []);

  const getInstructions = () => {
    switch (phase) {
      case 'inhale': return "INSPIRE";
      case 'hold': return "SEGURE"; 
      case 'exhale': return "EXPIRE";
    }
  };

  const handleExit = () => {
    navigate(Routes.DASHBOARD);
  };

  // Dynamic Styles for Animation
  const transitionStyle = {
    transition: phase === 'hold' ? 'none' : 'transform 4s ease-in-out',
    transform: `scale(${scale})`,
  };

  return (
    // Alterado de bg-black para a cor de Surface (#0F0A15) para ser mais calmante
    <Wrapper centerContent className="bg-[#0F0A15]">
      {/* Background Ambience - Ajustado gradiente para fundir com o roxo escuro */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#A78BFA10] via-[#0F0A15] to-[#0F0A15] pointer-events-none" />

      {/* Título 'S.O.S' REMOVIDO para limpar a interface */}

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10 overflow-y-auto scrollbar-hide py-20">
        
        {/* Container for Breathing Circle & Text Overlay */}
        <div className="relative flex items-center justify-center mb-8">
          
          {/* Animated Circle Container */}
          {/* Reduced size: w-40 (160px) */}
          <div 
            className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border-2 flex items-center justify-center relative shadow-[0_0_40px_rgba(167,139,250,0.2)]"
            style={{ 
              borderColor: COLORS.Cyan,
              ...transitionStyle
            }}
          >
            {/* Inner Glow Core */}
            <div 
              className="w-full h-full rounded-full absolute opacity-20"
              style={{ backgroundColor: COLORS.Cyan }}
            />
          </div>

          {/* Text Instruction - Absolutely Centered over the Circle */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h1 
              className="text-xl font-bold tracking-[0.2em] transition-all duration-500"
              style={{ color: COLORS.Cyan }}
            >
              {getInstructions()}
            </h1>
          </div>
        </div>

        {/* Instruction Text */}
        <p 
          className="text-sm text-center max-w-xs opacity-60 animate-pulse mb-8" 
          style={{ color: COLORS.TextSecondary }}
        >
          Concentre-se apenas no movimento do círculo.
        </p>

        {/* --- SECTION: PRACTICAL TIPS --- */}
        <div className="w-full max-w-xs bg-[#0F0A15]/50 border border-[#2E243D] rounded-xl p-5 backdrop-blur-sm animate-fadeIn">
          <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4 text-center text-gray-400">
            PRÓXIMOS PASSOS PARA QUEBRAR O CICLO:
          </h3>
          
          <div className="flex flex-col gap-3">
            <TipItem icon="water" text="Beba um copo grande de água gelada." />
            <TipItem icon="door" text="Saia do ambiente onde você está agora." />
            <TipItem icon="gym" text="Faça 15 agachamentos ou flexões." />
            <TipItem icon="cold" text="Molhe o rosto e a nuca com água fria." />
          </div>
        </div>

      </div>

      {/* Safety Exit Button */}
      <div className="w-full pb-6 px-4 pt-2 flex items-end justify-center shrink-0">
        <div 
          className={`transition-opacity duration-1000 w-full ${showExitButton ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <Button 
            variant="outline" 
            onClick={handleExit}
            className="border-white/20 text-white/50 hover:text-white hover:border-white transition-colors h-12 text-sm"
          >
            Já estou no controle (Sair)
          </Button>
        </div>
      </div>
    </Wrapper>
  );
};

// Sub-component for Tip Items
const TipItem: React.FC<{ icon: string; text: string }> = ({ icon, text }) => {
  const getIconPath = () => {
    switch (icon) {
      case 'water': return "M20 12c0 4.418-3.582 8-8 8s-8-3.582-8-8C4 8 12 2 12 2s8 6 20 10z";
      case 'door': return "M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1";
      case 'gym': return "M13 10V3L4 14h7v7l9-11h-7z"; // Using lightning for energy expend
      case 'cold': return "M12 3v18m-6.364-1.636l12.728-12.728M3 12h18M5.636 5.636l12.728 12.728"; // Snow
      default: return "";
    }
  };

  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">
        <svg className="w-4 h-4" style={{ color: COLORS.Cyan }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={getIconPath()} />
        </svg>
      </div>
      <p className="text-xs font-medium text-gray-300 leading-snug">
        {text}
      </p>
    </div>
  );
};