import React from 'react';
import { COLORS } from '../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'outline';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = true, 
  isLoading = false,
  className = '',
  ...props 
}) => {
  let bgStyle = {};
  let textClass = 'text-white';
  let borderClass = 'border-transparent';

  switch (variant) {
    case 'primary':
      bgStyle = { backgroundColor: COLORS.Primary };
      break;
    case 'danger':
      bgStyle = { backgroundColor: COLORS.Danger };
      break;
    case 'outline':
      bgStyle = { backgroundColor: 'transparent' };
      borderClass = `border border-[${COLORS.Border}]`;
      textClass = `text-[${COLORS.TextSecondary}]`;
      break;
  }

  return (
    <button
      className={`
        relative overflow-hidden font-semibold py-3.5 px-4 rounded-xl transition-all active:scale-[0.98] active:opacity-90
        disabled:opacity-50 disabled:cursor-not-allowed
        ${fullWidth ? 'w-full' : 'w-auto'}
        ${borderClass}
        ${textClass}
        ${className}
      `}
      style={variant !== 'outline' ? bgStyle : { borderColor: COLORS.Border, color: COLORS.TextSecondary }}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};