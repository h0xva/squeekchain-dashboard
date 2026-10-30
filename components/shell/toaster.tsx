"use client";

import { Coins, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useDashboard } from "@/lib/dashboard-context";

export function Toaster() {
  const { toasts, dismissToast } = useDashboard();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-24 right-3 z-50 flex w-[min(360px,calc(100vw-24px))] flex-col gap-2 md:bottom-6 md:right-6"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
            className="pointer-events-auto relative overflow-hidden rounded-2xl border border-gold/25 bg-surface-2/95 p-4 shadow-[0_20px_60px_-20px_rgb(245_184_61/0.45)] backdrop-blur-xl"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--color-gold),transparent)]" />
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold">
                <Coins size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-1">{toast.title}</p>
                {toast.body ? <p className="mt-0.5 text-xs leading-5 text-ink-3">{toast.body}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss"
                className="grid size-6 place-items-center rounded-md text-ink-3 hover:bg-white/5 hover:text-ink-1"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
