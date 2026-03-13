import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-800 dark:text-slate-300">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-sky-500 dark:focus:ring-sky-500 ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-rose-500 dark:focus:border-rose-400 dark:focus:ring-rose-400'
            : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 dark:text-rose-300">{error}</p>}
    </div>
  );
}
