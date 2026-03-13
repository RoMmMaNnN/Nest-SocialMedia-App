import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#080b12] disabled:cursor-not-allowed disabled:opacity-50';

  const variants = {
    primary:
      'border-gray-900 bg-gray-900 text-white hover:bg-gray-700 focus:ring-gray-500 dark:border-sky-500 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400 dark:focus:ring-sky-400',
    secondary:
      'border-gray-300 bg-white text-gray-800 hover:bg-gray-50 focus:ring-gray-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:ring-slate-500',
    danger:
      'border-red-600 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:border-rose-500 dark:bg-rose-500 dark:text-rose-950 dark:hover:bg-rose-400 dark:focus:ring-rose-400',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}
