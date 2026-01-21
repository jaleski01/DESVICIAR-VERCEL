import React, { useState } from 'react';
import { logTrigger } from '../services/triggerService';
import { auth } from '../lib/firebase';
import { COLORS } from '../types';
import { Button } from './Button';

interface TriggerModalProps {
  onClose: () => void;
}

const EMOTIONS = [
  "Estresse", "Tédio", "Solidão", "Ansiedade", 
  "Excitação", "Tristeza", "Cansaço", "Raiva"
];

const CONTEXTS = [
  "Redes Sociais", "Sozinho em casa", "Insônia", 
  "Banho/Cama", "Trabalho/Estudo", "Conflito Pessoal", 
  "Filmes/Séries", "Nada específico"
];

export const TriggerModal: React.FC<TriggerModalProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [emotion, setEmotion] = useState<string | null>(null);
  const [context, setContext] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!auth.currentUser || !emotion || !context) return;
    
    setIsSubmitting(true);
    try {
      await logTrigger(auth.currentUser.uid, emotion, context, intensity);
      // Small delay for visual feedback if needed, then close
      onClose();
    } catch (error) {
      console.error("Error logging trigger:", error);
      alert("Erro ao salvar. Tente novamente.");
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="animate-fadeIn">
            <h2 className="text-lg font-bold text-white mb-4 text-center">O que você está sentindo?</h2>
            <div className="grid grid-cols-2 gap-3">
              {EMOTIONS.map((item) => (
                <button
                  key={item}
                  onClick={() => setEmotion(item)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    emotion === item 
                      ? 'bg-violet-600/20 border-violet-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]' 
                      : 'bg-[#1F2937] border-[#374151] text-gray-400 hover:bg-[#374151]'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="animate-fadeIn">
            <h2 className="text-lg font-bold text-white mb-4 text-center">O que disparou isso?</h2>
            <div className="grid grid-cols-2 gap-3">
              {CONTEXTS.map((item) => (
                <button
                  key={item}
                  onClick={() => setContext(item)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    context === item 
                      ? 'bg-violet-600/20 border-violet-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]' 
                      : 'bg-[#1F2937] border-[#374151] text-gray-400 hover:bg-[#374151]'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="animate-fadeIn flex flex-col items-center">
            <h2 className="text-lg font-bold text-white mb-2 text-center">Nível da Vontade</h2>
            <p className="text-xs text-gray-400 mb-8">1 = Controlável, 5 = Insuportável</p>
            
            <div className="w-full flex justify-between items-center px-2 mb-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  onClick={() => setIntensity(val)}
                  className={`w-12 h-12 rounded-full font-bold text-lg transition-all flex items-center justify-center border-2 ${
                    intensity === val 
                      ? 'bg-red-500 border-red-500 text-white scale-110 shadow-lg' 
                      : 'bg-transparent border-gray-700 text-gray-500'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            
            <div className="w-full h-2 bg-gray-800 rounded-full mt-4 overflow-hidden">
               <div 
                 className="h-full bg-gradient-to-r from-yellow-500 to-red-600 transition-all duration-300"
                 style={{ width: `${(intensity / 5) * 100}%` }}
               />
            </div>
            <p className="mt-4 text-sm font-bold" style={{ color: intensity > 3 ? COLORS.Danger : COLORS.Primary }}>
              {intensity === 5 ? "CRÍTICO" : intensity >= 3 ? "ALTO" : "MODERADO"}
            </p>
          </div>
        );
    }
  };

  return (
    // FIX: Z-Index 9999 ensures it's above everything. items-center ensures perfect centering.
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div 
        className="w-full max-w-sm bg-[#0F0A15] border border-[#2E243D] rounded-2xl shadow-2xl relative overflow-hidden flex flex-col"
        style={{ maxHeight: '85vh' }}
      >
        {/* Progress Bar */}
        <div className="w-full h-1 bg-[#2E243D]">
          <div 
            className="h-full bg-violet-500 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-white z-10"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 flex-1 overflow-y-auto scrollbar-hide">
          {renderStepContent()}
        </div>

        <div className="p-4 border-t border-[#2E243D]">
          {step < 3 ? (
            <Button 
              onClick={handleNext}
              disabled={(step === 1 && !emotion) || (step === 2 && !context)}
            >
              Próximo
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              isLoading={isSubmitting}
              className="bg-red-600 hover:bg-red-700 border-none"
            >
              Registrar e Seguir Forte
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};