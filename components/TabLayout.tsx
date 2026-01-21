import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { COLORS, Routes } from '../types';

/**
 * TabLayout
 * Atua como o 'Navigator' principal da aplicação logada.
 * Gerencia a barra de navegação inferior fixa e a área de conteúdo.
 */
export const TabLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Helper para determinar se a rota está ativa
  const isActive = (path: string) => location.pathname === path;

  // Navegação para as rotas
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    // CONTAINER PRINCIPAL:
    // h-[100dvh] garante que o app ocupe exatos 100% da altura da viewport dinâmica (mobile)
    // relative e overflow-hidden impedem o scroll na janela principal
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden flex flex-col">
      
      {/* 
        ÁREA DE CONTEÚDO (Outlet):
        Ocupa todo o espaço disponível. As telas internas (Dashboard, etc) 
        gerenciam seu próprio scroll interno.
      */}
      <div className="flex-1 w-full h-full relative z-0">
        <Outlet />
      </div>

      {/* 
        HUB / MENU INFERIOR:
        Posicionado absolutamente na base.
        Backdrop-blur para efeito moderno.
      */}
      <div 
        className="absolute bottom-0 left-0 w-full z-50 border-t pb-safe"
        style={{ 
          height: '80px', // Altura fixa para o Hub
          backgroundColor: 'rgba(11, 16, 26, 0.95)', // Surface com transparência
          borderColor: COLORS.Border,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}
      >
        <div className="flex justify-around items-center h-full px-2 pb-2">
          
          {/* TAB: DASHBOARD */}
          <button 
            onClick={() => handleNavigation(Routes.DASHBOARD)}
            className="flex flex-col items-center justify-center w-16 h-full space-y-1 active:scale-95 transition-transform"
          >
            <svg className="w-6 h-6" fill={isActive(Routes.DASHBOARD) ? COLORS.Primary : "none"} stroke={isActive(Routes.DASHBOARD) ? COLORS.Primary : COLORS.TextSecondary} viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className={`text-[10px] font-bold ${isActive(Routes.DASHBOARD) ? 'text-white' : 'text-gray-500'}`}>
              Home
            </span>
          </button>

          {/* TAB: PROGRESSO */}
          <button 
            onClick={() => handleNavigation(Routes.PROGRESS)}
            className="flex flex-col items-center justify-center w-16 h-full space-y-1 active:scale-95 transition-transform"
          >
            <svg className="w-6 h-6" fill={isActive(Routes.PROGRESS) ? COLORS.Primary : "none"} stroke={isActive(Routes.PROGRESS) ? COLORS.Primary : COLORS.TextSecondary} viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className={`text-[10px] font-bold ${isActive(Routes.PROGRESS) ? 'text-white' : 'text-gray-500'}`}>
              Evolução
            </span>
          </button>

          {/* TAB: LEARNING (BASE) */}
          <button 
            onClick={() => handleNavigation(Routes.LEARNING)}
            className="flex flex-col items-center justify-center w-16 h-full space-y-1 active:scale-95 transition-transform"
          >
            <svg className="w-6 h-6" fill={isActive(Routes.LEARNING) ? COLORS.Primary : "none"} stroke={isActive(Routes.LEARNING) ? COLORS.Primary : COLORS.TextSecondary} viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className={`text-[10px] font-bold ${isActive(Routes.LEARNING) ? 'text-white' : 'text-gray-500'}`}>
              Base
            </span>
          </button>

          {/* TAB: PERFIL */}
          <button 
            onClick={() => handleNavigation(Routes.PROFILE)}
            className="flex flex-col items-center justify-center w-16 h-full space-y-1 active:scale-95 transition-transform"
          >
            <svg className="w-6 h-6" fill={isActive(Routes.PROFILE) ? COLORS.Primary : "none"} stroke={isActive(Routes.PROFILE) ? COLORS.Primary : COLORS.TextSecondary} viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className={`text-[10px] font-bold ${isActive(Routes.PROFILE) ? 'text-white' : 'text-gray-500'}`}>
              Perfil
            </span>
          </button>

        </div>
      </div>
    </div>
  );
};