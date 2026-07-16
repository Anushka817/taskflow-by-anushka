/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />,
    error: <X className="h-5 w-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-indigo-500 shrink-0" />,
  };

  const bgClasses = {
    success: 'bg-zinc-900/95 border border-emerald-500/30 text-zinc-100 shadow-emerald-950/10 dark:bg-zinc-900/95 dark:text-zinc-100',
    error: 'bg-zinc-900/95 border border-rose-500/30 text-zinc-100 shadow-rose-950/10 dark:bg-zinc-900/95 dark:text-zinc-100',
    warning: 'bg-zinc-900/95 border border-amber-500/30 text-zinc-100 shadow-amber-950/10 dark:bg-zinc-900/95 dark:text-zinc-100',
    info: 'bg-zinc-900/95 border border-indigo-500/30 text-zinc-100 shadow-indigo-950/10 dark:bg-zinc-900/95 dark:text-zinc-100',
  };

  const progressColors = {
    success: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    error: 'bg-gradient-to-r from-rose-500 to-red-400',
    warning: 'bg-gradient-to-r from-amber-500 to-yellow-400',
    info: 'bg-gradient-to-r from-indigo-500 to-blue-400',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`relative overflow-hidden p-4 rounded-2xl shadow-2xl backdrop-blur-xl flex items-start gap-3 pointer-events-auto transition-all ${bgClasses[toast.type]}`}
    >
      <div className="mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 text-xs font-bold leading-relaxed">{toast.message}</div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-zinc-400 hover:text-zinc-100 transition-colors p-0.5 rounded-lg hover:bg-white/5 cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Decorative time-decay indicator bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 4, ease: 'linear' }}
          className={`h-full ${progressColors[toast.type]}`}
        />
      </div>
    </motion.div>
  );
};
