import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrapper } from '../components/Wrapper';
import { Button } from '../components/Button';
import { COLORS, Routes } from '../types';

export const SupportScreen: React.FC = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const supportEmail = 'suporte@scardsvc.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Wrapper centerContent noPadding>
      <div className="flex flex-col items-center justify-center h-full w-full px-6 text-center animate-fadeIn">
        {/* Ícone */}
        <div className="mb-6 p-5 rounded-2xl bg-violet-500/10 border border-violet-500/20">
          <svg className="w-12 h-12 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Título e Texto */}
        <h1 className="text-2xl font-bold text-white mb-3">Suporte Técnico</h1>
        <p className="text-sm text-gray-400 mb-10 max-w-[280px] leading-relaxed">
          Teve problemas com o acesso ou pagamento? Entre em contato com nossa equipe via e-mail.
        </p>

        {/* Caixa de E-mail */}
        <div 
          className="w-full mb-10 p-4 rounded-xl border flex flex-col items-center gap-3 bg-surface" 
          style={{ backgroundColor: COLORS.Surface, borderColor: COLORS.Border }}
        >
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Endereço de Suporte</span>
          <span className="text-lg font-mono font-bold text-white selection:bg-violet-500/30">
            {supportEmail}
          </span>
          
          <button 
            onClick={handleCopyEmail}
            className={`mt-2 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
              copied ? 'bg-green-500/20 text-green-500' : 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20'
            }`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copiado!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copiar E-mail
              </>
            )}
          </button>
        </div>

        {/* Botão Voltar */}
        <div className="w-full max-w-[200px]">
          <Button variant="outline" onClick={() => navigate(Routes.LOGIN)}>
            Voltar ao Login
          </Button>
        </div>

        <p className="mt-12 text-[10px] uppercase tracking-widest text-gray-700 font-bold">
          DSVC Protocol Response Team
        </p>
      </div>
    </Wrapper>
  );
};