import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastContext = createContext(null);

const iconMap = { success: CheckCircle2, error: XCircle, info: Info };
const styles = {
  success: 'border-zinc-200 bg-white text-zinc-900',
  error: 'border-red-200 bg-white text-zinc-900',
  info: 'border-zinc-200 bg-white text-zinc-900',
};
const iconStyles = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-zinc-400',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 w-80">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => {
            const Icon = iconMap[t.type] || Info;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={cn('flex items-start gap-2.5 rounded-lg border p-3 shadow-elevated', styles[t.type])}
              >
                <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', iconStyles[t.type])} />
                <p className="flex-1 text-sm leading-snug">{t.message}</p>
                <button onClick={() => removeToast(t.id)} className="shrink-0 text-zinc-400 hover:text-zinc-600"><X className="h-3.5 w-3.5" /></button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
