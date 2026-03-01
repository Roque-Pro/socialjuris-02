import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  icon, 
  rightElement,
  className = '',
  id,
  ...props 
}) => {
  const inputId = id || props.name || Math.random().toString(36).substr(2, 9);

  return (
    <div className="w-full space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`
            block w-full rounded-lg border border-gray-300 bg-white py-2.5 
            ${icon ? 'pl-10' : 'pl-3'} 
            ${rightElement ? 'pr-10' : 'pr-3'}
            text-gray-900 placeholder-gray-400
            focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none
            disabled:bg-gray-50 disabled:text-gray-500
            transition-all duration-200 ease-in-out
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className}
          `}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600 animate-pulse">{error}</p>}
    </div>
  );
};