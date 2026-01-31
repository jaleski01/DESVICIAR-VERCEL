import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore'; 
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { auth, db } from '../lib/firebase'; 
import { Wrapper } from '../components/Wrapper';
import { Button } from '../components/Button';
import { COLORS, Routes } from '../types';
import InstallPwaPrompt from '../components/InstallPwaPrompt';
import { motion, AnimatePresence } from 'framer-motion';

type LoginStep = 'EMAIL' | 'PASSWORD' | 'FIRST_ACCESS_SENT';

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginStep, setLoginStep] = useState<LoginStep>('EMAIL');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Hook para gerenciar o Timer de Reenvio
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Limpa erro ao digitar
  useEffect(() => {
    setError(null);
  }, [email, password]);

  /**
   * Padrão Fake Success: 
   * Blindagem contra enumeração de e-mail.
   */
  const handleSecurePasswordReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) return setError("Digite seu e-mail primeiro.");
    
    setIsLoading(true);
    setError(null);

    try {
      await sendPasswordResetEmail(auth, email);
      // Sucesso Real
      setLoginStep('FIRST_ACCESS_SENT');
      setResendTimer(60);
    } catch (err: any) {
      // TRATAMENTO DE SEGURANÇA (Fake Success)
      if (err.code === 'auth/user-not-found') {
        // Simulamos sucesso para o usuário, mas não enviamos nada (Blindagem)
        setLoginStep('FIRST_ACCESS_SENT');
        setResendTimer(60);
      } else if (err.code === 'auth/invalid-email') {
        setError("E-mail inválido. Verifique o formato.");
      } else {
        setError("Erro de conexão. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Passo 1: Validação de E-mail e Detecção de Fluxo
   */
  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError("Digite seu e-mail.");
    
    setError(null);
    setIsLoading(true);

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);

      if (methods.includes('password')) {
        setLoginStep('PASSWORD');
      } else {
        // Inicia fluxo de primeiro acesso blindado
        await handleSecurePasswordReset();
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-email') {
        setError("Formato de e-mail inválido.");
      } else {
        setError("Falha na verificação de acesso.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Passo 2: Autenticação Final
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      const userDocSnap = await getDoc(doc(db, "users", uid));

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();

        // TRAVA DE SEGURANÇA (PAYWALL) - Lógica Permissiva
        const status = userData?.subscription_status;
        const blockedStatuses = ['canceled', 'unpaid', 'past_due'];

        if (status && blockedStatuses.includes(status)) {
          await signOut(auth);
          setError("Sua assinatura não está ativa. Status: " + status);
          setIsLoading(false);
          return;
        }
        // Se for 'active', 'trialing' ou undefined -> Deixa passar

        if (userData?.onboarding_completed) {
          navigate(Routes.DASHBOARD);
        } else {
          navigate(Routes.ONBOARDING);
        }
      } else {
        navigate(Routes.ONBOARDING);
      }
    } catch (err: any) {
      setError("Senha incorreta. Tente novamente.");
      setIsLoading(false);
    }
  };

  const resetFlow = () => {
    setLoginStep('EMAIL');
    setPassword('');
    setError(null);
  };

  return (
    <Wrapper noPadding>
      <div className="flex flex-col h-[100dvh] w-full bg-black overflow-hidden">
        <div className="flex-1 overflow-y-auto w-full px-6 scrollbar-hide">
          <div className="flex flex-col items-center pt-24 pb-40">
            
            {/* Logo Section - Ocultado no estado FIRST_ACCESS_SENT */}
            {loginStep !== 'FIRST_ACCESS_SENT' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mb-6 relative group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <img 
                  src="https://i.imgur.com/j9b02I4.png" 
                  alt="Logo Desviciar" 
                  className="relative w-24 h-24 object-contain drop-shadow-2xl" 
                />
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {loginStep !== 'FIRST_ACCESS_SENT' ? (
                <motion.div 
                  key="login-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full flex flex-col items-center"
                >
                  <h1 className="text-4xl font-bold tracking-tighter text-white font-mono text-center mb-2">
                    DESVICIAR
                  </h1>
                  
                  <p className="text-sm mb-12 text-center px-4" style={{ color: COLORS.TextSecondary }}>
                    Acesse o sistema para prosseguir sua jornada.
                  </p>

                  <div className="w-full max-w-sm">
                    {loginStep === 'EMAIL' && (
                      <form onSubmit={handleContinue} className="space-y-5">
                        {error && (
                          <div className="p-3 rounded-lg text-xs font-medium border text-center bg-red-500/10 border-red-500/20 text-red-400">
                            {error}
                          </div>
                        )}
                        <div className="space-y-1">
                          <label className="text-xs font-medium ml-1 text-gray-500">E-mail que realizou o pagamento</label>
                          <div className="flex items-center rounded-xl px-4 py-3.5 bg-[#0F0A15] border border-[#2E243D] focus-within:ring-1 focus-within:ring-violet-500 transition-all">
                            <input 
                              type="email" 
                              value={email} 
                              onChange={(e) => setEmail(e.target.value)} 
                              placeholder="email@exemplo.com" 
                              className="bg-transparent w-full outline-none text-white placeholder-slate-600" 
                              required 
                            />
                          </div>
                        </div>
                        <Button type="submit" isLoading={isLoading}>Continuar</Button>
                        <button 
                          type="button" 
                          onClick={handleSecurePasswordReset}
                          className="w-full text-center text-xs font-bold text-gray-600 py-2 hover:text-violet-500 transition-colors"
                        >
                          Esqueci minha senha / Primeiro Acesso
                        </button>
                      </form>
                    )}

                    {loginStep === 'PASSWORD' && (
                      <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                          <div className="p-3 rounded-lg text-xs font-medium border text-center bg-red-500/10 border-red-500/20 text-red-400">
                            {error}
                          </div>
                        )}
                        
                        <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                           </div>
                           <span className="text-xs text-white font-medium truncate">{email}</span>
                           <button type="button" onClick={resetFlow} className="ml-auto text-[10px] font-bold text-violet-500 hover:underline">Trocar</button>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium ml-1 text-gray-500">Sua Senha</label>
                          <div className="flex items-center rounded-xl px-4 py-3.5 bg-[#0F0A15] border border-[#2E243D] focus-within:ring-1 focus-within:ring-violet-500 transition-all">
                            <input 
                              type="password" 
                              value={password} 
                              onChange={(e) => setPassword(e.target.value)} 
                              placeholder="••••••••" 
                              className="bg-transparent w-full outline-none text-white placeholder-slate-600" 
                              autoFocus
                              required 
                            />
                          </div>
                        </div>
                        <Button type="submit" isLoading={isLoading}>Entrar no Sistema</Button>
                        <button 
                          type="button" 
                          onClick={handleSecurePasswordReset}
                          className="w-full text-center text-xs font-bold text-gray-500 py-2 hover:text-violet-500 transition-colors"
                        >
                          Esqueci minha senha / Primeiro Acesso
                        </button>
                      </form>
                    )}
                  </div>
                </motion.div>
              ) : (
                /* STEP: SUCCESS STATE (FIRST_ACCESS_SENT) */
                <motion.div 
                  key="success-state"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-sm flex flex-col items-center"
                >
                  <div className="w-20 h-20 bg-violet-500/20 rounded-full flex items-center justify-center mb-6 text-violet-500">
                     <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                     </svg>
                  </div>

                  <h1 className="text-2xl font-bold text-white mb-4 text-center">
                    Verifique seu e-mail
                  </h1>

                  <div className="p-6 rounded-2xl bg-[#0F0A15] border border-[#2E243D] text-center mb-8">
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Se houver uma conta vinculada ao e-mail <strong className="text-white">{email}</strong>, enviamos um link para você definir sua senha.
                    </p>
                    <p className="mt-4 text-xs text-gray-500 italic">
                      Verifique sua caixa de entrada e também a pasta de spam.
                    </p>
                  </div>

                  <div className="w-full space-y-4">
                    {resendTimer > 0 ? (
                      <div className="w-full py-3.5 text-center text-xs font-bold text-gray-600 bg-gray-900/50 rounded-xl border border-gray-800">
                        Reenviar em {resendTimer}s
                      </div>
                    ) : (
                      <Button onClick={handleSecurePasswordReset} isLoading={isLoading}>
                        Reenviar E-mail
                      </Button>
                    )}
                    
                    <button 
                      onClick={resetFlow}
                      className="w-full text-center text-sm font-bold text-gray-400 py-2 hover:text-white transition-colors"
                    >
                      Voltar para Login
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-12 text-center">
              <p className="text-xs text-gray-500">
                Problemas com o e-mail?{" "}
                <button 
                  onClick={() => navigate(Routes.SUPPORT)} 
                  className="font-bold text-violet-500 hover:underline"
                >
                  Contatar Suporte
                </button>
              </p>
            </div>
          </div>
        </div>
        <InstallPwaPrompt />
      </div>
    </Wrapper>
  );
};