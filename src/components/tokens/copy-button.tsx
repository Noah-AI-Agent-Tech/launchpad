import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  label?: string;
  className?: string;
};

/** Tiny copy-to-clipboard control; shows a check for a moment after copying. */
export function CopyButton({ value, label = "Copy", className }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied" : label}
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value).then(() => setCopied(true));
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-md text-subtle-foreground transition-colors hover:text-foreground",
        copied && "text-success hover:text-success",
        className,
      )}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
    </button>
  );
}
