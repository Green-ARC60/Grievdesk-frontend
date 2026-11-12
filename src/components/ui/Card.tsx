import React, { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'surface-2' | 'flat';
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'surface',
  noPadding = false,
  className = '',
  ...props
}) => {
  const bgClass =
    variant === 'surface-2' ? 'bg-surface-2' : variant === 'flat' ? 'bg-transparent' : 'bg-surface';

  return (
    <div
      className={`${bgClass} border border-border rounded-card ${noPadding ? '' : 'p-4 sm:p-5'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

