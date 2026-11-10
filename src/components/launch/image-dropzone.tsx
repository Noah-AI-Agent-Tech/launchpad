import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ACCEPT = ["image/png", "image/jpeg", "image/webp"];

type Props = {
  file: File | null;
  onChange: (file: File | null, error: string | null) => void;
  error?: string | null;
};

/** Click-or-drop picker for the token artwork, with preview and validation. */
export function ImageDropzone({ file, onChange, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // Object URL for the preview; revoked when the file changes.
  useEffect(() => {
    if (!file) {
      setPreview(null);
      setWarning(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    const img = new Image();
    img.onload = () =>
      setWarning(
        img.naturalWidth !== img.naturalHeight
          ? `${img.naturalWidth}×${img.naturalHeight} — square artwork looks best.`
          : null,
      );
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const accept = (f: File | undefined) => {
    if (!f) return;
    if (!ACCEPT.includes(f.type)) return onChange(null, "Use a PNG, JPEG or WebP image.");
    if (f.size > MAX_IMAGE_BYTES) return onChange(null, "Image must be 2 MB or smaller.");
    onChange(f, null);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(",")}
        className="sr-only"
        onChange={(e) => {
          accept(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {file && preview ? (
        <div className="flex items-center gap-4 rounded-xl border border-primary/10 bg-background/40 p-3">
          <img src={preview} alt="" className="size-16 rounded-xl object-cover ring-1 ring-foreground/10" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-subtle-foreground">
              {(file.size / 1024).toFixed(0)} KB{warning ? ` · ${warning}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null, null)}
            aria-label="Remove image"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-primary/5 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            accept(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex w-full items-center gap-4 rounded-xl border border-dashed p-4 text-left transition-colors",
            dragging
              ? "border-tide/60 bg-tide/5"
              : error
                ? "border-destructive/50 hover:bg-primary/5"
                : "border-primary/20 hover:border-primary/40 hover:bg-primary/5",
          )}
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface text-muted-foreground">
            <ImagePlus className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-medium">Choose a PNG, JPEG or WebP</span>
            <span className="block text-xs text-subtle-foreground">Square artwork, up to 2 MB — or drop it here</span>
          </span>
        </button>
      )}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
