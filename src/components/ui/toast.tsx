import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CircleCheck, CircleX, ExternalLink, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bottom-right toasts: a glass card with a countdown bar, an icon, a title,
 * a line of detail and an optional link-out ("View"). Hovering pauses the
 * countdown. Generic on purpose — trades use it first, anything can later.
 */

export type ToastTone = "success" | "warning" | "error" | "info";

export type ToastInput = {
  tone?: ToastTone;
  title: string;
  description?: React.ReactNode;
  /** e.g. { label: "View", href } — opens in a new tab. */
  action?: { label: string; href: string };
  /** ms; 0 keeps it until closed. */
  duration?: number;
};

type Toast = ToastInput & { id: number };

const ToastContext = createContext<((t: ToastInput) => number) | null>(null);

/** Up to this many at once; the oldest makes room. */
const MAX = 4;
const DEFAULT_MS = 7000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);
  const toast = useCallback((input: ToastInput) => {
    const id = nextId.current++;
    setToasts((all) => [...all, { ...input, id }].slice(-MAX));
    return id;
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <ol
          aria-live="polite"
          className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
        >
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </ol>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const TONE = {
  success: { icon: CircleCheck, text: "text-success", bar: "bg-success" },
  warning: { icon: AlertTriangle, text: "text-warning", bar: "bg-warning" },
  error: { icon: CircleX, text: "text-destructive", bar: "bg-destructive" },
  info: { icon: Info, text: "text-tide", bar: "bg-tide" },
} as const;

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const tone = TONE[toast.tone ?? "info"];
  const Icon = tone.icon;
  const duration = toast.duration ?? DEFAULT_MS;
  const [paused, setPaused] = useState(false);
  const [shown, setShown] = useState(false);

  // Counts down only while not hovered, resuming where it stopped.
  const remaining = useRef(duration);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  useEffect(() => {
    if (!duration || paused) return;
    const started = Date.now();
    const t = setTimeout(() => dismissRef.current(), remaining.current);
    return () => {
      clearTimeout(t);
      remaining.current -= Date.now() - started;
    };
  }, [duration, paused]);

  useEffect(() => {
    const r = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const style = useMemo(() => ({ animationDuration: `${duration}ms` }), [duration]);

  return (
    <li
      role={toast.tone === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn(
        "pointer-events-auto relative overflow-hidden rounded-2xl border border-white/10 bg-charcoal/85 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-all duration-300",
        shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
      )}
    >
      {duration > 0 && (
        <span
          aria-hidden
          style={{ ...style, animationPlayState: paused ? "paused" : "running" }}
          className={cn("absolute inset-x-0 top-0 h-[3px] origin-left animate-[toast-countdown_linear_forwards]", tone.bar)}
        />
      )}
      <div className="flex gap-3 py-3.5 pr-10 pl-4">
        <Icon className={cn("mt-0.5 size-5 shrink-0", tone.text)} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{toast.title}</p>
          {toast.description && <div className="mt-0.5 text-[13px] leading-snug break-words text-muted-foreground">{toast.description}</div>}
          {toast.action && (
            <a
              href={toast.action.href}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-white/15"
            >
              {toast.action.label} <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="absolute top-2.5 right-2.5 rounded-full p-1 text-subtle-foreground transition-colors hover:bg-white/10 hover:text-white"
      >
        <X className="size-4" />
      </button>
    </li>
  );
}
