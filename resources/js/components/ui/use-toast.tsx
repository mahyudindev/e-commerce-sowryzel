import React, { createContext, useContext, useReducer, useEffect } from 'react';

export type ToastActionElement = React.ReactElement<HTMLButtonElement>;

export type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  action?: ToastActionElement;
  type?: 'default' | 'success' | 'error' | 'warning' | 'info';
};

const TOAST_REMOVE_DELAY = 3000;

type ToastState = {
  toasts: ToastProps[];
};

type ToastAction = 
  | { type: 'ADD_TOAST'; toast: ToastProps }
  | { type: 'UPDATE_TOAST'; toast: Partial<ToastProps> & { id: string } }
  | { type: 'DISMISS_TOAST'; toastId?: string }
  | { type: 'REMOVE_TOAST'; toastId?: string };

const toastReducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case 'ADD_TOAST': {
      return {
        ...state,
        toasts: [...state.toasts, action.toast],
      };
    }
    
    case 'UPDATE_TOAST': {
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };
    }
    
    case 'DISMISS_TOAST': {
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: state.toasts.map((t) => ({
            ...t,
            dismissed: true,
          })),
        };
      }
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId ? { ...t, dismissed: true } : t
        ),
      };
    }
    
    case 'REMOVE_TOAST': {
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    }
    
    default: {
      return state;
    }
  }
};

const ToastContext = createContext<{
  toasts: ToastProps[];
  toast: (props: Omit<ToastProps, "id">) => void;
  dismiss: (toastId?: string) => void;
  update: (props: Partial<ToastProps> & { id: string }) => void;
}>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
  update: () => {},
});

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  const toast = (props: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    dispatch({ type: 'ADD_TOAST', toast: { ...props, id } });
    return id;
  };

  const dismiss = (toastId?: string) => {
    dispatch({ type: 'DISMISS_TOAST', toastId });
  };

  const update = (props: Partial<ToastProps> & { id: string }) => {
    dispatch({ type: 'UPDATE_TOAST', toast: props });
  };

  return (
    <ToastContext.Provider value={{ toasts: state.toasts, toast, dismiss, update }}>
      {children}
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

export const Toast = ({ 
  title, 
  description, 
  type = 'default',
  action,
  className,
  ...props 
}: ToastProps & { className?: string }) => {
  let bgColor = 'bg-white';
  let textColor = 'text-gray-900';
  let borderColor = 'border-gray-200';
  
  switch (type) {
    case 'success':
      bgColor = 'bg-green-50';
      textColor = 'text-green-800';
      borderColor = 'border-green-200';
      break;
    case 'error':
      bgColor = 'bg-red-50';
      textColor = 'text-red-800';
      borderColor = 'border-red-200';
      break;
    case 'warning':
      bgColor = 'bg-yellow-50';
      textColor = 'text-yellow-800';
      borderColor = 'border-yellow-200';
      break;
    case 'info':
      bgColor = 'bg-blue-50';
      textColor = 'text-blue-800';
      borderColor = 'border-blue-200';
      break;
  }
  
  return (
    <div
      className={`${bgColor} ${textColor} rounded-md border ${borderColor} p-4 shadow-md`}
      {...props}
    >
      {title && <h3 className="font-medium">{title}</h3>}
      {description && <div className="mt-1 text-sm">{description}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
};

export const Toaster = () => {
  const { toasts, dismiss } = useToast();
  
  useEffect(() => {
    toasts.forEach((toast) => {
      const timer = setTimeout(() => {
        dismiss(toast.id);
      }, TOAST_REMOVE_DELAY);

      return () => clearTimeout(timer);
    });
  }, [toasts, dismiss]);

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 md:p-6 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          action={toast.action}
          type={toast.type}
          className="animate-in slide-in-from-bottom-5"
        />
      ))}
    </div>
  );
};
