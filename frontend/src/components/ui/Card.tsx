import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`card rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/85 dark:shadow-[0_10px_40px_-22px_rgba(56,189,248,0.55)] ${className}`}
    >
      {children}
    </div>
  );
}
