'use client';
import { createContext, useCallback, useContext, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error';
type ToastItem = { id: number; message: string; type: ToastType };

const ToastContext = createContext<{
  show: (message: string, type?: ToastType) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-fade-slide-up rounded-md border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur ${
              t.type === 'success'
                ? 'border-brand-dark/30 bg-brand/15 text-brand-dark'
                : 'border-red-500/30 bg-red-500/10 text-red-600'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}