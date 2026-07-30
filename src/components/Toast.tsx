import { useEffect } from 'react';
import { CheckCircle2, X, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toast: ToastState;
  onDismiss: (id: number) => void;
}

const config = {
  success: { icon: CheckCircle2, className: 'text-sage-600', bg: 'bg-white' },
  error: { icon: AlertCircle, className: 'text-red-600', bg: 'bg-white' },
  info: { icon: Info, className: 'text-blue-600', bg: 'bg-white' },
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const cfg = config[toast.type];
  const Icon = cfg.icon;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div className="animate-slide-up flex items-center gap-3 rounded-lg border border-ink-200 bg-white px-4 py-3 shadow-float">
      <Icon className={`h-5 w-5 shrink-0 ${cfg.className}`} />
      <p className="text-sm font-medium text-ink-800">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-2 text-ink-400 transition-colors hover:text-ink-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastState[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
