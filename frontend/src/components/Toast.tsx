import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
}

interface ToastContextType {
  showToast: (msg: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((msg: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { ...msg, id };
    setToasts((prev) => [...prev.slice(-3), newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success' || !t.type;
          const isError = t.type === 'error';
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl bg-card/95 backdrop-blur-md border border-hairline shadow-lg text-xs animate-in slide-in-from-bottom-3 duration-200"
            >
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-[#3FA85C] shrink-0 mt-0.5" />}
              {isError && <AlertCircle className="w-4 h-4 text-[#E85D8A] shrink-0 mt-0.5" />}
              {t.type === 'info' && <Info className="w-4 h-4 text-accent-blue shrink-0 mt-0.5" />}

              <div className="flex-1 space-y-0.5">
                <div className="font-semibold text-[#0A0A0A]">{t.title}</div>
                {t.description && <p className="text-[#5A5A55] leading-relaxed">{t.description}</p>}
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="p-1 rounded-full hover:bg-black/5 text-[#8A8A85] hover:text-[#0A0A0A] transition-colors cursor-pointer"
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

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
