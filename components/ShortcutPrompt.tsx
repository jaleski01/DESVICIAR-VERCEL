import React, { useEffect, useState, useRef } from 'react';
import { COLORS } from '../types';
import { Button } from './Button';

/**
 * ShortcutPrompt
 * 
 * Gerencia o convite para instalação do PWA.
 * No Android/Chrome: Captura o evento nativo e dispara via botão.
 * No iOS: Exibe um guia manual de instalação.
 */
export const ShortcutPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [step, setStep] = useState<'prompt' | 'ios_guide'>('prompt');
  const deferredPrompt = useRef<any>(null);

  useEffect(() => {
    // 1. Verifica se já está em modo Standalone (App instalado)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (navigator as any).standalone === true;
    
    if (isStandalone) return;

    // 2. Verifica se o usuário já dispensou este aviso (LocalStorage)
    // Comentado conforme solicitado para facilitar testes, mas pronto para produção.
    const hasSeenPrompt = localStorage.getItem('shortcut_prompt_seen');
    if (hasSeenPrompt === 'true') return;

    // 3. Detecta se é iOS
    const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isApple);

    // 4. Captura o evento nativo (Android/Chrome/Desktop)
    const handleBeforeInstallPrompt = (e: any) => {
      // Impede o banner nativo automático (que muitas vezes falha por falta de engajamento)
      e.preventDefault();
      // Salva o evento para dispararmos manualmente
      deferredPrompt.current = e;
      // Mostra nosso componente customizado após um delay estratégico
      setTimeout(() => setIsVisible(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Fluxo iOS: Não há evento nativo, então mostramos por tempo de sessão
    if (isApple) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('shortcut_prompt_seen', 'true');
  };

  const handleCreateShortcut = async () => {
    // Caso iOS: Mostra o guia passo a passo
    if (isIOS) {
      setStep('ios_guide');
      return;
    }

    // Caso Android/Chrome: Dispara o prompt nativo que capturamos
    if (deferredPrompt.current) {
      deferredPrompt.current.prompt();
      
      const { outcome } = await deferredPrompt.current.userChoice;
      console.log('Resultado da instalação:', outcome);
      
      // Limpa o evento e fecha o modal independente da escolha
      deferredPrompt.current = null;
      handleDismiss();
    } else {
      // Fallback: Caso o navegador suporte PWA mas o evento não tenha disparado ainda
      alert("Para instalar, toque nos 3 pontos do navegador e selecione 'Instalar App' ou 'Adicionar à tela inicial'.");
      handleDismiss();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[9999] animate-fadeInUp">
      <div 
        className="w-full bg-black/90 backdrop-blur-xl border border-violet-500/30 rounded-2xl p-6 shadow-[0_20px_50px_rgba(139,92,246,0.3)] overflow-hidden relative"
      >
        {/* Efeito Visual de Fundo */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        {step === 'prompt' ? (
          <div className="animate-fadeIn">
            <div className="flex items-center gap-4 mb-5">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-gray-900 border border-gray-800"
              >
                <img 
                  src="https://i.imgur.com/nyLkCgz.png" 
                  alt="App Icon" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-base">Instalar Protocolo</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Acesse o sistema instantaneamente pela sua tela de início em modo tela cheia.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleDismiss}
                className="flex-1 py-3 text-xs font-bold text-gray-500 hover:text-white transition-colors active:scale-95"
              >
                Agora não
              </button>
              <Button 
                onClick={handleCreateShortcut}
                className="flex-[2] py-3 text-sm h-auto font-bold tracking-wide shadow-lg shadow-violet-900/20 active:scale-95 transition-transform"
              >
                Instalar Agora
              </Button>
            </div>
          </div>
        ) : (
          <div className="animate-fadeIn">
            <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Instalar no iPhone
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-400 border border-violet-500/30 shrink-0 mt-0.5">1</div>
                <p className="text-xs text-gray-300">
                  Toque no ícone de <strong>Compartilhar</strong> (quadrado com seta para cima) na barra inferior.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-400 border border-violet-500/30 shrink-0 mt-0.5">2</div>
                <p className="text-xs text-gray-300">
                  Role a lista e selecione <strong>"Adicionar à Tela de Início"</strong>.
                </p>
              </div>
            </div>

            <Button onClick={handleDismiss} className="w-full py-3 text-sm h-auto font-bold">
              Entendi
            </Button>

            <div className="flex justify-center mt-4">
              <svg className="w-6 h-6 text-violet-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};