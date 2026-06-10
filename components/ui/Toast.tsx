"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  show: boolean;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
  onClose: () => void;
}

export default function Toast({
  show,
  message,
  type = "success",
  duration = 4000,
  onClose
}: ToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
  };

  const borderColors = {
    success: "border-emerald-100 bg-emerald-50 text-emerald-900 shadow-emerald-100/40",
    error: "border-rose-100 bg-rose-50 text-rose-900 shadow-rose-100/40",
    warning: "border-amber-100 bg-amber-50 text-amber-900 shadow-amber-100/40",
    info: "border-blue-100 bg-blue-50 text-blue-900 shadow-blue-100/40",
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className={cn(
            "fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3.5 rounded-2xl border shadow-xl max-w-md backdrop-blur-md",
            borderColors[type]
          )}
        >
          {icons[type]}
          
          <div className="flex-1 text-sm font-semibold tracking-tight leading-relaxed">
            {message}
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-black/5 rounded-lg transition-colors cursor-pointer shrink-0"
            aria-label="Close notification"
          >
            <X className="w-4 h-4 opacity-60 hover:opacity-100" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
