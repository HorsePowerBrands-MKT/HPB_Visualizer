import React, { SelectHTMLAttributes } from 'react';
import { Label } from './Label';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

export const Select: React.FC<SelectProps> = ({ label, id, children, className, ...props }) => {
  const selectId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      <Label htmlFor={selectId}>{label}</Label>
      <select
        id={selectId}
        className={`flex h-10 w-full items-center justify-between rounded-md border border-brand-primary/50 bg-brand-black-secondary px-3 py-2 text-sm ring-offset-brand-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
};
