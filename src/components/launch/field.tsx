import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: string | null;
  /** e.g. "12/32" */
  counter?: string;
  className?: string;
  children: React.ReactNode;
};

/** Label + control + hint/error line. */
export function Field({ label, htmlFor, hint, error, counter, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
        {counter && (
          <span className="font-mono text-[11px] text-subtle-foreground tabular-nums">{counter}</span>
        )}
      </div>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-subtle-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "h-10 w-full rounded-lg border border-primary/10 bg-background/40 px-3 text-sm outline-none transition-colors placeholder:text-subtle-foreground focus-visible:border-tide/50 focus-visible:ring-3 focus-visible:ring-tide/20 aria-invalid:border-destructive/60";

export function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
