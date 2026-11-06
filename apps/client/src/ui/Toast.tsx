import { IconAlertTriangle, IconCircleCheck } from '@tabler/icons-react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type Tone = 'success' | 'error';
type Toast = { id: number; message: string; tone: Tone };

const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => {});

/** Reports the outcome of an action for 4 seconds, above every layer, and announces it to screen readers. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, tone: Tone = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
  }, []);

  return (
    <ToastContext value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 flex-col items-center gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-enter border-gray-2 flex items-center gap-2 rounded-md border bg-white px-4 py-3 text-sm shadow-lg"
          >
            {toast.tone === 'success' ? (
              <IconCircleCheck aria-hidden size={18} stroke={1.5} className="text-green" />
            ) : (
              <IconAlertTriangle aria-hidden size={18} stroke={1.5} className="text-red" />
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export const useToast = () => useContext(ToastContext);
