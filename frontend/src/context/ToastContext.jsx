import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Toasts } from '../components/ui/Toasts';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((message, type = 'success') => {
    const id = ++nextId.current;
    setToasts((current) => [...current.slice(-3), { id, message, type }]);
    timers.current.set(id, setTimeout(() => dismiss(id), 4200));
  }, [dismiss]);

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach(clearTimeout);
      activeTimers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ notify, toasts, dismiss }}>
      {children}
      <ToastViewport global />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext).notify;
}

export function ToastViewport({ global = false }) {
  const { toasts, dismiss } = useContext(ToastContext);
  return <Toasts toasts={toasts} dismiss={dismiss} global={global} />;
}
