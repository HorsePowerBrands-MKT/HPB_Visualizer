import React, { ButtonHTMLAttributes } from 'react';

interface RadioGroupProps {
  children: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

const RadioGroupContext = React.createContext<{ value: string; onValueChange: (value: string) => void; } | null>(null);

export const RadioGroup: React.FC<RadioGroupProps> = ({ children, value, onValueChange, className }) => {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div role="radiogroup" className={className}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
};

export const RadioGroupItem: React.FC<ButtonHTMLAttributes<HTMLButtonElement> & { value: string }> = ({ value, ...props }) => {
  const context = React.useContext(RadioGroupContext);
  if (!context) {
    throw new Error("RadioGroupItem must be used within a RadioGroup");
  }
  const isChecked = context.value === value;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isChecked}
      data-state={isChecked ? 'checked' : 'unchecked'}
      onClick={() => context.onValueChange(value)}
      className="aspect-square h-4 w-4 rounded-full border border-brand-primary text-brand-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
    >
      {isChecked && (
        <div className="flex items-center justify-center">
          <div className="h-2.5 w-2.5 rounded-full bg-current text-current" />
        </div>
      )}
    </button>
  );
};
