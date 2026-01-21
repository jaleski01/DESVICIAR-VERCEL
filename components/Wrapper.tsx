import React from 'react';
import { BaseProps, COLORS } from '../types';

interface WrapperProps extends BaseProps {
  centerContent?: boolean;
  noPadding?: boolean; // Nova prop para remover padding padrão
}

/**
 * Wrapper Component
 * Container principal seguro.
 * 
 * ATUALIZAÇÃO: Adicionado suporte a 'noPadding' para telas que gerenciam
 * seu próprio scroll e espaçamento (como Dashboard), garantindo full-width real.
 */
export const Wrapper: React.FC<WrapperProps> = ({ 
  children, 
  className = '', 
  centerContent = false,
  noPadding = false
}) => {
  return (
    <div 
      className={`
        h-[100dvh] w-full flex flex-col relative overflow-hidden
        ${centerContent ? 'justify-center items-center' : ''}
        ${className}
      `}
      style={{ 
        backgroundColor: COLORS.Background,
        color: COLORS.TextPrimary 
      }}
    >
      <div 
        className={`
          flex-1 w-full max-w-md mx-auto flex flex-col h-full overflow-hidden
          ${!noPadding ? 'px-6 py-4' : ''} 
        `}
      >
        {children}
      </div>
    </div>
  );
};