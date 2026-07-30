import { useCallback, useState } from 'react';
import type { ToastState, ToastType } from '@/components/Toast';

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  return {
    toasts,
    dismiss,
    toast,
    success: (m: string) => toast('success', m),
    error: (m: string) => toast('error', m),
    info: (m: string) => toast('info', m),
  };
}
