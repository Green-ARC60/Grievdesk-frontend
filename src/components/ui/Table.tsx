import React from 'react';

export const Table: React.FC<{
  headers?: React.ReactNode[];
  children: React.ReactNode;
  className?: string;
}> = ({ headers, children, className = '' }) => {
  return (
    <div className={`w-full overflow-x-auto border border-border rounded-card bg-surface ${className}`}>
      <table className="w-full text-left border-collapse text-sm">
        {headers && (
          <thead>
            <tr className="border-b border-border bg-surface-2/60 text-muted text-xs uppercase tracking-wider font-mono">
              {headers.map((h, i) => (
                <th key={i} className="py-2.5 px-3 sm:px-4 font-medium whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-border">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <tr
      className={`hover:bg-surface-2/50 transition-colors duration-150 ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
};

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <td className={`py-2.5 px-3 sm:px-4 text-text align-middle ${className}`} {...props}>
      {children}
    </td>
  );
};

export const ListContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`border border-border rounded-card bg-surface divide-y divide-border overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

export const ListRow: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { onClick?: () => void; isInteractive?: boolean }
> = ({ children, className = '', onClick, isInteractive, ...props }) => {
  const clickable = Boolean(onClick || isInteractive);
  return (
    <div
      onClick={onClick}
      className={`p-3 sm:p-4 flex items-center justify-between gap-3 transition-colors duration-150 ${
        clickable ? 'cursor-pointer hover:bg-surface-2/60 active:bg-surface-2' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

