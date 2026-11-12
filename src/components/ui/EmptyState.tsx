import React from 'react';

export interface EmptyStateProps {
  message: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  action,
  className = '',
}) => {
  return (
    <div className={`py-12 px-4 text-center ${className}`}>
      <p className="text-sm text-muted">{message}</p>
      {action && <div className="mt-3 flex justify-center">{action}</div>}
    </div>
  );
};

export default EmptyState;

