import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore'; 
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase'; 
import { Wrapper } from '../components/Wrapper';
import { Button } from '../components/Button';
import { COLORS, Routes } from '../types';
import InstallPwaPrompt from '../components/InstallPwaPrompt';

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Limpa erros ao alternar entre login e recuperação de senha
  useEffect(() => {
    setError(null);
  }, [isResetMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user) throw new Error("Usuário não identificado.");

      const uid = userCredential.user.uid;
      const userDocRef = doc(db, "users", uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();

        // --- TRAVA DE SEGURANÇA (PAYWALL) ---
        if (userData?.subscription_status !== 'active') {
          // 1. Desloga o usuário imediatamente do Firebase Auth
          await signOut(auth);
          // 2. Define a mensagem de erro para exibição na UI
          setError("Sua assinatura não está ativa. Verifique seu pagamento.");
          // 3. Para o spinner do botão
          setIsLoading(false);
          // 4. Interrompe o fluxo de navegação
          return;
        }
        // -------------------------------------

        if (userData?.onboarding_completed) {
          navigate(Routes.DASHBOARD);
        } else {
          navigate(Routes.ONBOARDING);
        }
      } else {
        // Se o documento não existir, o usuário é novo e deve ir para o onboarding
        navigate(Routes.ONBOARDING);
      }
    } catch (err: any) {
      let errorMessage = "Ocorreu um erro ao acessar.";
      
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = "Email ou senha incorretos.";
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = "Muitas tentativas. Tente novamente em alguns minutos.";
      } else if (err.code === 'auth/invalid-api-key') {
        errorMessage = "Erro de configuração. Contate o suporte.";
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError("Por favor, digite seu e-mail.");
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
    } catch (err: any) {
      setError("Erro ao enviar email. Verifique o endereço digitado.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = (mode: boolean) => {
    setIsResetMode(mode);
    setResetEmailSent(false);
  };

  return (
    <Wrapper noPadding>
      <div className="flex flex-col h-[100dvh] w-full bg-black overflow-hidden">
        <div className="flex-1 overflow-y-auto w-full px-6 scrollbar-hide">
          <div className="flex flex-col items-center pt-24 pb-40">
            <div className="mb-6 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <img 
                src="https://i.imgur.com/j9b02I4.png" 
                alt="Logo Desviciar" 
                className="relative w-24 h-24 object-contain drop-shadow-2xl" 
              />
            </div>

            <h1 className="text-4xl font-bold tracking-tighter text-white font-mono text-center mb-2">
              {isResetMode ? 'ATIVAR ACESSO' : 'DESVICIAR'}
            </h1>
            
            <p className="text-sm mb-12 text-center px-4" style={{ color: COLORS.TextSecondary }}>
              {isResetMode 
                ? 'Defina sua senha inicial ou recupere seu acesso.' 
                : 'Acesse o sistema para prosseguir sua jornada.'}
            </p>

            {!isResetMode ? (
              <form onSubmit={handleSubmit} className="w-full space-y-5 animate-fadeIn">
                {error && (
                  <div className="p-3 rounded-lg text-xs font-medium border text-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#FCA5A5', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                    {error}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-medium ml-1" style={{ color: COLORS.TextSecondary }}>Email</label>
                  <div className="flex items-center rounded-xl px-4 py-3.5 transition-colors focus-within:ring-1 focus-within:ring-violet-500" style={{ backgroundColor: COLORS.Surface, border: `1px solid ${COLORS.Border}` }}>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" className="bg-transparent w-full outline-none text-white placeholder-slate-600" required />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium ml-1" style={{ color: COLORS.TextSecondary }}>Senha</label>
                  <div className="flex items-center rounded-xl px-4 py-3.5 transition-colors focus-within:ring-1 focus-within:ring-violet-500" style={{ backgroundColor: COLORS.Surface, border: `1px solid ${COLORS.Border}` }}>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-transparent w-full outline-none text-white placeholder-slate-600" required minLength={6} />
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  <button 
                    type="button" 
                    onClick={() => toggleMode(true)} 
                    className="text-xs font-bold hover:opacity-80 transition-opacity" 
                    style={{ color: COLORS.Primary }}
                  >
                    Primeiro Acesso / Reset de senha
                  </button>
                </div>

                <div className="pt-4">
                  <Button type="submit" isLoading={isLoading}>Entrar no Sistema</Button>
                </div>
              </form>
            ) : (
              <div className="w-full space-y-5 animate-fadeIn">
                {resetEmailSent ? (
                  <div className="flex flex-col gap-4">
                    <div className="p-5 rounded-xl border flex items-center gap-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                      <div className="p-2 bg-green-500/20 rounded-full text-green-500">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">Link Enviado!</p>
                        <p className="text-xs text-gray-400">Verifique sua caixa de entrada e spam.</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => toggleMode(false)} fullWidth>Voltar ao Login</Button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-5">
                    {error && (
                      <div className="p-3 rounded-lg text-xs font-medium border text-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#FCA5A5', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                        {error}
                      </div>
                    )}
                    
                    <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 mb-2">
                      <p className="text-xs text-violet-200 leading-relaxed">
                        Insira o e-mail utilizado na compra para receber o link de definição de senha.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium ml-1" style={{ color: COLORS.TextSecondary }}>Email da Compra</label>
                      <div className="flex items-center rounded-xl px-4 py-3.5 transition-colors focus-within:ring-1 focus-within:ring-violet-500" style={{ backgroundColor: COLORS.Surface, border: `1px solid ${COLORS.Border}` }}>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" className="bg-transparent w-full outline-none text-white placeholder-slate-600" required />
                      </div>
                    </div>
                    <div className="pt-4 space-y-3">
                      <Button type="submit" isLoading={isLoading}>Enviar Link de Acesso</Button>
                      <Button type="button" variant="outline" onClick={() => toggleMode(false)} disabled={isLoading}>Voltar ao Login</Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {!isResetMode && (
              <div className="mt-10 text-center">
                <p className="text-xs" style={{ color: COLORS.TextSecondary }}>
                  Problemas com o e-mail?{" "}
                  <button 
                    onClick={() => navigate(Routes.SUPPORT)} 
                    className="font-bold cursor-pointer hover:underline" 
                    style={{ color: COLORS.Primary }}
                  >
                    Contatar Suporte
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
        <InstallPwaPrompt />
      </div>
    </Wrapper>
  );
};