import React, { useState } from 'react';
import { COLORS } from '../types';
import { DEBUG_DATA } from '../data/neuroDebugData';

export const NeuroDebugCard: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<typeof DEBUG_DATA[0] | null>(null);
  const [step, setStep] = useState<'LIE' | 'TRUTH'>('LIE');

  const handleOpen = (item: typeof DEBUG_DATA[0]) => {
    setSelectedItem(item);
    setStep('LIE');
  };

  const handleClose = () => {
    setSelectedItem(null);
    setStep('LIE');
  };

  const handleRevealTruth = () => {
    setStep('TRUTH');
  };

  const handleFinish = () => {
    // Gamification (XP alert) removed as requested.
    // The action now seamlessly closes the modal without interruption.
    handleClose();
  };

  return (
    <div className="flex flex-col w-full my-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]"></div>
        <h3 
          className="text-[10px] font-bold uppercase tracking-widest opacity-80"
          style={{ color: COLORS.TextSecondary }}
        >
          Neuro-Debug (Gatilhos)
        </h3>
      </div>

      {/* 
          UI UPDATE: GRID CENTRALIZADA (Fixed Layout)
          - flex-wrap: Permite quebra de linha
          - justify-center: Centraliza o bloco
          - w-[45%]: Garante 2 itens por linha com gap
      */}
      <div className="flex flex-wrap justify-center gap-3 w-full mb-5">
        {DEBUG_DATA.map((item) => (
          <button
            key={item.id}
            onClick={() => handleOpen(item)}
            className="w-[45%] py-4 px-2 rounded-xl border transition-all active:scale-95 flex items-center justify-center shadow-sm"
            style={{ 
              backgroundColor: '#1F2937', 
              borderColor: '#374151',
            }}
          >
            <span className="text-xs font-bold text-white tracking-wide text-center">
              {item.trigger}
            </span>
          </button>
        ))}
      </div>

      {/* MODAL OVERLAY */}
      {selectedItem && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
            onClick={handleClose}
          />

          {/* Card Content */}
          <div 
            className="w-full max-w-sm relative rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 transform"
            style={{ 
              backgroundColor: COLORS.Surface,
              border: `1px solid ${step === 'TRUTH' ? '#10B981' : COLORS.Border}`,
              boxShadow: step === 'TRUTH' ? '0 0 30px rgba(16, 185, 129, 0.2)' : 'none'
            }}
          >
            {/* Header Stripe */}
            <div 
              className="h-1.5 w-full"
              style={{ backgroundColor: step === 'TRUTH' ? '#10B981' : COLORS.Primary }}
            />

            <div className="p-6">
              {/* Trigger Title */}
              <h2 
                className="text-center text-xs font-bold uppercase tracking-widest mb-6"
                style={{ color: step === 'TRUTH' ? '#10B981' : COLORS.TextSecondary }}
              >
                {step === 'LIE' ? `Gatilho: ${selectedItem.trigger}` : 'A VERDADE RACIONAL'}
              </h2>

              {step === 'LIE' ? (
                // STATE 1: THE LIE
                <div className="flex flex-col gap-6 animate-fadeIn">
                  <p className="text-center text-lg font-medium text-white leading-relaxed">
                    "Qual mentira seu cérebro está contando agora?"
                  </p>
                  
                  <button
                    onClick={handleRevealTruth}
                    className="w-full p-4 rounded-xl border border-dashed border-gray-600 bg-gray-900/50 hover:bg-gray-800 transition-colors text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-red-400 mt-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </span>
                      <span className="text-sm italic text-gray-300 group-hover:text-white transition-colors">
                        "{selectedItem.lie}"
                      </span>
                    </div>
                  </button>
                  
                  <p className="text-center text-[10px] text-gray-500 uppercase">
                    Toque na mentira para desmascará-la
                  </p>
                </div>
              ) : (
                // STATE 2: THE TRUTH
                <div className="flex flex-col gap-6 animate-fadeIn">
                   <div className="bg-[#10B981]/10 p-4 rounded-xl border border-[#10B981]/30">
                     <p className="text-sm font-semibold leading-relaxed text-white">
                       "{selectedItem.truth}"
                     </p>
                   </div>

                   <button
                    onClick={handleFinish}
                    className="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#10B981' }}
                   >
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                     Entendi e desarmei
                   </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};