import { ChevronLeft, XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

/**
 * Frosted glass modal, after Noah Builder's: a dim overlay, a translucent
 * blurred panel with a light-catching gradient hairline, and a header row of
 * Back (optional) and Close above a large title.
 */

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Panel width; defaults to a comfortable form width. */
  className?: string;
  children: React.ReactNode;
};

/** The hairline: a 1px gradient ring, brightest at the top-left corner. */
const GLASS_BORDER: React.CSSProperties = {
  background:
    "radial-gradient(ellipse at top left, rgba(255,255,255,0.3) 10%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.05) 80%, rgba(255,255,255,0.3) 100%)",
  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude",
};

export function Modal({ open, onOpenChange, className, children }: ModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#090B0E]/50 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-[calc(100%-2rem)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-[#22262b]/40 text-sm text-foreground shadow-[0_24px_80px_-12px_rgba(0,0,0,0.6)] backdrop-blur-[18px] outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl p-px" style={GLASS_BORDER} />
          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

type HeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Small label above the title, e.g. a step. */
  eyebrow?: React.ReactNode;
  onBack?: () => void;
  /** Shown above the title, e.g. a status badge on a result screen. */
  icon?: React.ReactNode;
  /** Hide Close while something can't be interrupted (e.g. a wallet prompt). */
  closable?: boolean;
};

export function ModalHeader({ title, description, eyebrow, onBack, icon, closable = true }: HeaderProps) {
  return (
    <div className="px-6 pt-5">
      <div className="flex h-8 items-center justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="-ml-1.5 flex items-center gap-1 rounded-md py-1 pr-2 pl-1 text-sm text-white transition-colors hover:bg-white/5"
          >
            <ChevronLeft className="size-4" /> Back
          </button>
        ) : (
          <span className="font-mono text-[11px] tracking-wide text-subtle-foreground uppercase">{eyebrow}</span>
        )}
        {closable && (
          <DialogPrimitive.Close className="-mr-1.5 rounded-full p-1.5 text-white transition-colors hover:bg-white/5">
            <XIcon className="size-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </div>
      {icon && <div className="mt-3">{icon}</div>}
      {onBack && eyebrow && (
        <p className="mt-3 font-mono text-[11px] tracking-wide text-subtle-foreground uppercase">{eyebrow}</p>
      )}
      <DialogPrimitive.Title className={cn("text-[22px] leading-tight font-bold text-white", onBack && eyebrow ? "mt-1" : "mt-3")}>
        {title}
      </DialogPrimitive.Title>
      {description ? (
        <DialogPrimitive.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </DialogPrimitive.Description>
      ) : (
        <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
      )}
    </div>
  );
}

export function ModalBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-4 px-6 pt-5 pb-6", className)} {...props} />;
}

/** Right-aligned actions row at the foot of a modal body. */
export function ModalActions({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

/** Inset panel for summaries inside a modal. */
export const modalPanelClass = "rounded-xl border border-white/10 bg-black/20";
