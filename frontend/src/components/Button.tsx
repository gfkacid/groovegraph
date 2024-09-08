import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline';
  className?: string;
}

export function Button({ children, variant = 'default', className = '', ...props }: ButtonProps) {
  const baseClasses = 'font-semibold px-6 py-2 rounded-full transition-colors duration-200';
  const variantClasses = {
    default: 'bg-green-500 hover:bg-green-600 text-black',
    outline: 'bg-transparent border border-gray-600 text-white hover:bg-gray-700',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}