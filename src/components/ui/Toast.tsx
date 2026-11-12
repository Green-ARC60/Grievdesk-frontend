import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2 sm:p-0">
        {toasts.map((toast) => {
          const typeClasses = {
            success: 'border-status-resolved-text/30 bg-status-resolved-bg text-status-resolved-text',
            error: 'border-status-escalated-text/30 bg-status-escalated-bg text-status-escalated-text',
            info: 'border-status-new-text/30 bg-status-new-bg text-status-new-text',
          };
          const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertCircle : Info;

          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-card border-[1.5px] border-border shadow-soft bg-surface text-text text-sm transition-all duration-150 animate-slideUp"
            >
              <div className="flex items-center gap-2.5">
                <span className={`p-1 rounded-control ${typeClasses[toast.type]}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-text font-medium text-xs sm:text-sm">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-muted hover:text-text p-1 rounded-control transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (msg: string) => console.log('[Toast fallback]', msg),
    };
  }
  return context;
};

export default ToastProvider;

