import React, { useState } from 'react';
import { Wrapper } from '../components/Wrapper';
import { COLORS } from '../types';
import { LEARNING_MODULES, LearningModule, LearningStep } from '../data/learningModules';

export const LearningScreen: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);

  // --- ICONS ---
  const getIcon = (name: string, color: string) => {
    switch (name) {
      case 'shield':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'document':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'mic':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
      case 'play':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <Wrapper noPadding>
      {/* 
        CONTAINER DE SCROLL VERTICAL 
        flex-1, h-full, overflow-y-auto: Estrutura segura de scroll.
      */}
      <div className="flex-1 w-full h-full overflow-y-auto scrollbar-hide bg-black">
        
        {/* 
          CONTAINER DE CONTEÚDO
          px-5: Padding lateral de 20px
          w-full: Garante largura total
          pb-32: Margem para o menu inferior
        */}
        <div className="w-full max-w-full px-5 pt-6 pb-32 flex flex-col">
          
          {/* Header */}
          <div className="flex flex-col mb-6">
            <h1 className="text-xl font-bold text-white tracking-wide">
              Base de Conhecimento
            </h1>
            <p className="text-xs" style={{ color: COLORS.TextSecondary }}>
              Neurociência, táticas e ferramentas de bloqueio.
            </p>
          </div>

          {/* Modules Grid - Flex Column with w-full */}
          <div className="flex flex-col gap-4 w-full">
            {LEARNING_MODULES.map((module) => (
              <button
                key={module.id}
                onClick={() => setSelectedModule(module)}
                className="flex items-center w-full p-4 rounded-xl border transition-all active:scale-[0.98] group relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${module.gradientStart} 0%, ${module.gradientEnd} 100%)`,
                  borderColor: '#1F2937', 
                }}
              >
                {/* Icon Container */}
                <div 
                  className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center bg-black/40 border border-white/5 mr-4 shadow-lg backdrop-blur-sm"
                >
                  {getIcon(module.icon, module.accentColor)}
                </div>

                {/* Text Info */}
                <div className="flex-1 text-left z-10 min-w-0"> {/* min-w-0 prevents flex items from overflowing */}
                  <span 
                    className="text-[9px] font-bold uppercase tracking-widest mb-1 block opacity-80"
                    style={{ color: module.accentColor }}
                  >
                    {module.category}
                  </span>
                  <h3 className="text-sm font-bold text-white leading-tight mb-1 truncate">
                    {module.title}
                  </h3>
                  <p 
                    className="text-[11px] font-medium leading-snug truncate"
                    style={{ color: '#94A3B8' }}
                  >
                     {module.subtitle}
                  </p>
                </div>

                {/* Chevron */}
                <div className="opacity-30 group-hover:opacity-100 transition-opacity z-10 ml-2 flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedModule && (
        <ModuleDetailModal 
          module={selectedModule} 
          onClose={() => setSelectedModule(null)} 
        />
      )}
    </Wrapper>
  );
};

// --- SUB-COMPONENTS ---

interface ModalProps {
  module: LearningModule;
  onClose: () => void;
}

const ModuleDetailModal: React.FC<ModalProps> = ({ module, onClose }) => {
  const hasSteps = (module.androidSteps && module.androidSteps.length > 0) || (module.iosSteps && module.iosSteps.length > 0);
  const [activeTab, setActiveTab] = useState<'ANDROID' | 'IOS'>('ANDROID');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="w-full max-w-lg bg-[#0B101A] border border-[#1C2533] rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className="p-5 border-b border-[#1C2533] flex justify-between items-start bg-[#05090F]">
          <div>
            <span 
              className="text-[10px] font-bold uppercase tracking-widest mb-1 block"
              style={{ color: module.accentColor }}
            >
               {module.category}
            </span>
            <h2 className="text-lg font-bold text-white">{module.title}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-colors">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        {/* Added pb-32 to fix last item visibility */}
        <div className="flex-1 overflow-y-auto p-5 pb-32 scrollbar-hide">
          
          {/* Intro */}
          <div 
             className="p-4 rounded-xl border mb-6"
             style={{ 
               backgroundColor: `${module.accentColor}10`, // 10% opacity
               borderColor: `${module.accentColor}30`     // 30% opacity
             }}
          >
            <p className="text-sm text-gray-300 leading-relaxed">
              {module.intro}
            </p>
          </div>

          {/* Tutorial Steps (Only if Steps exist) */}
          {hasSteps ? (
            <>
              {/* OS Toggle */}
              <div className="flex bg-[#1F2937] p-1 rounded-xl mb-6">
                <button 
                  onClick={() => setActiveTab('ANDROID')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors duration-200 border ${
                    activeTab === 'ANDROID' 
                      ? 'bg-[#0B101A] text-white border-[#374151] shadow-lg' 
                      : 'bg-transparent text-gray-500 border-transparent hover:text-gray-300'
                  }`}
                >
                  ANDROID
                </button>
                <button 
                  onClick={() => setActiveTab('IOS')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors duration-200 border ${
                    activeTab === 'IOS' 
                      ? 'bg-[#0B101A] text-white border-[#374151] shadow-lg' 
                      : 'bg-transparent text-gray-500 border-transparent hover:text-gray-300'
                  }`}
                >
                  IPHONE (iOS)
                </button>
              </div>

              {/* Steps List */}
              <div className="space-y-4">
                {(activeTab === 'ANDROID' ? module.androidSteps : module.iosSteps)?.map((step, idx) => (
                  <StepItem key={idx} step={step} index={idx} accentColor={module.accentColor} />
                ))}
              </div>
            </>
          ) : (
             <div className="flex flex-col items-center justify-center py-10 opacity-50">
                <svg className="w-12 h-12 text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className="text-xs text-gray-500">Conteúdo completo em breve.</p>
             </div>
          )}

        </div>
        {/* Footer Removed */}
      </div>
    </div>
  );
};

const StepItem: React.FC<{ step: LearningStep, index: number, accentColor: string }> = ({ step, index, accentColor }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (step.copyValue) {
      navigator.clipboard.writeText(step.copyValue).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 flex flex-col items-center">
         <div 
           className="w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold"
           style={{ backgroundColor: '#1F2937', borderColor: '#374151', color: accentColor }}
         >
           {index + 1}
         </div>
         {/* Vertical line connection */}
         <div className="w-px h-full bg-[#1F2937] my-1 last:hidden"></div>
      </div>
      
      <div className="flex-1 pb-4">
        {step.isCopyable ? (
          <button 
            onClick={handleCopy}
            className={`
              w-full text-left p-3 rounded-lg border border-dashed transition-all group relative overflow-hidden
              ${copied 
                ? 'bg-green-900/20 border-green-500/50' 
                : 'bg-[#111827] border-gray-700 hover:border-blue-500'
              }
            `}
          >
            <p className="font-mono text-sm text-white font-bold tracking-wide break-all">
              {step.text}
            </p>
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
               {copied ? (
                 <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                 </svg>
               ) : (
                 <svg className="w-4 h-4 text-gray-600 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                 </svg>
               )}
            </div>
          </button>
        ) : (
          <p className="text-sm text-gray-300 leading-relaxed pt-0.5">
            {step.text}
          </p>
        )}
      </div>
    </div>
  );
};