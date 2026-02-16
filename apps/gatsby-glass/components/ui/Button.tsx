import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'tertiary';
}

export const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center text-center text-sm font-medium focus:outline-none disabled:opacity-50 disabled:pointer-events-none px-4 h-9 transition-all duration-300';

  const variantClasses = {
    primary: 'bg-transparent text-brand-gold border border-brand-gold hover:bg-brand-gold hover:text-brand-brown',
    secondary: 'bg-transparent text-white border border-white/30 hover:border-white hover:bg-white/10',
    outline: 'bg-transparent text-brand-gold border border-brand-gold hover:bg-brand-brown-hover',
    tertiary: 'bg-transparent text-gray-400 border-0 hover:text-white',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
