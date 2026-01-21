import React, { useEffect, useState } from 'react';

const InstallPwaPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Se já estiver instalado (Standalone), não mostra nada e encerra.
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    // 2. Detecta iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isDeviceIOS = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isDeviceIOS);

    // 3. Mostra o aviso após 1 segundo
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-in fade-in slide-in-from-bottom-10 duration-700">
      <div className="bg-[#111] border border-gray-800 rounded-2xl p-4 shadow-2xl max-w-md mx-auto relative">
        {/* Botão Fechar */}
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 text-gray-500 hover:text-white p-2"
        >
          ✕
        </button>

        <div className="flex items-center gap-4 mb-3 pr-6">
          <img 
            src="https://i.imgur.com/nyLkCgz.png" 
            alt="Icon" 
            className="w-12 h-12 rounded-xl" 
          />
          <div>
            <h3 className="text-white font-bold text-sm">Instalar App</h3>
            <p className="text-gray-400 text-xs">Melhor experiência em tela cheia.</p>
          </div>
        </div>

        {/* Instruções Dinâmicas */}
        <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-xs text-gray-300">
          {isIOS ? (
            <div className="flex flex-col gap-1">
              <p className="font-bold text-white mb-1">No iPhone (Safari/Chrome):</p>
              <div className="flex items-center gap-2">
                <span>1. Toque em</span>
                <span className="text-blue-400 font-bold">Compartilhar</span>
              </div>
              <div className="flex items-center gap-2">
                <span>2. Escolha</span>
                <span className="font-bold text-white bg-white/20 px-1 rounded">Adicionar à Tela de Início</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <p className="font-bold text-white mb-1">No Android (Chrome):</p>
              <div className="flex items-center gap-2">
                <span>1. Toque no menu</span>
                <span className="font-bold text-white bg-white/20 px-1.5 rounded">⋮</span>
              </div>
              <div className="flex items-center gap-2">
                <span>2. Selecione</span>
                <span className="font-bold text-white">Adicionar a tela inicial</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallPwaPrompt;