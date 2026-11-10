import { CopyButton } from "@/components/tokens/copy-button";
import { shortAddress } from "@/lib/format";

type Props = {
  label: string;
  value: string;
  head?: number;
  tail?: number;
};

/** Labelled address with a copy button. */
export function AddressRow({ label, value, head = 6, tail = 6 }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-xs text-subtle-foreground">{label}</p>
        <p className="truncate font-mono text-sm" title={value}>
          {shortAddress(value, head, tail)}
        </p>
      </div>
      <CopyButton value={value} label={`Copy ${label}`} className="size-7 shrink-0 justify-center" />
    </div>
  );
}
