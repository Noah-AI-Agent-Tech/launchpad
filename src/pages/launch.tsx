import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Check, Loader2, Rocket, Wallet } from "lucide-react";
import { BackLink } from "@/components/layout/back-link";
import { Field, inputClass, SectionTitle } from "@/components/launch/field";
import { ImageDropzone } from "@/components/launch/image-dropzone";
import { AddressRow } from "@/components/token/address-row";
import { cardClass } from "@/components/token/section-card";
import { TokenAvatar } from "@/components/tokens/token-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STAGE_LABEL, useLaunch, type LaunchResult, type LaunchStage } from "@/hooks/use-launch";
import { formatUsd } from "@/lib/format";
import { LAUNCH_FEE_SOL, LAUNCH_PRICING } from "@/lib/launch";
import { COUNTER_ASSETS, WSOL_MINT } from "@/lib/trade";
import { useWallet } from "@/lib/wallet";
import { cn } from "@/lib/utils";

const NAME_MAX = 32;

/** Every launch is paired with SOL. */
const SOL = COUNTER_ASSETS.find((a) => a.address === WSOL_MINT)!;
const QUOTE = { mint: SOL.address, symbol: SOL.symbol, logo: SOL.logoURI } as const;

/** Curve figures for a SOL-paired launch: opening/graduation market cap and the raise. */
type Pricing = typeof LAUNCH_PRICING;
const SYMBOL_MAX = 10;

type Form = {
  name: string;
  symbol: string;
  image: File | null;
  website: string;
  twitter: string;
  telegram: string;
  /**
   * First buy, as typed, in SOL — spent directly on the SOL-quoted curve.
   */
  devBuySol: string;
};

const empty: Form = {
  name: "",
  symbol: "",
  image: null,
  website: "",
  twitter: "",
  telegram: "",
  devBuySol: "",
};

function urlError(v: string, host?: string) {
  if (!v.trim()) return null;
  try {
    const u = new URL(v.trim());
    if (!/^https?:$/.test(u.protocol)) return "Use an http(s) link.";
    if (host && !u.hostname.endsWith(host)) return `Should be a ${host} link.`;
    return null;
  } catch {
    return "Enter a full URL, including https://";
  }
}

function validate(f: Form) {
  return {
    name: !f.name.trim()
      ? "Give the token a name."
      : f.name.length > NAME_MAX
        ? `Maximum ${NAME_MAX} characters.`
        : null,
    symbol: !f.symbol.trim()
      ? "Add a ticker symbol."
      : f.symbol.length > SYMBOL_MAX
        ? `Maximum ${SYMBOL_MAX} characters.`
        : /\s/.test(f.symbol)
          ? "No spaces in the symbol."
          : null,
    image: f.image ? null : "Add artwork for the token.",
    website: urlError(f.website),
    twitter: urlError(f.twitter),
    telegram: urlError(f.telegram, "t.me"),
    devBuySol: devBuyError(f.devBuySol),
  };
}

function devBuyError(v: string) {
  if (!v.trim()) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return "Enter a SOL amount.";
  return null;
}

export function LaunchPage() {
  const [form, setForm] = useState<Form>(empty);
  const [imageError, setImageError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Partial<Record<keyof Form, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const { account, setDialogOpen } = useWallet();
  const connected = Boolean(account);
  /** Snapshot of the form at the moment the launch confirmed. */
  const [launched, setLaunched] = useState<{ form: Form } | null>(null);

  const { launch, reset, stage, result, busy } = useLaunch();

  const errors = useMemo(() => validate(form), [form]);
  const show = (k: keyof typeof errors) => (submitted || touched[k] ? errors[k] : null);
  const valid = Object.values(errors).every((e) => !e) && !imageError;


  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected) {
      setDialogOpen(true);
      return;
    }
    setSubmitted(true);

    if (!valid) {
      // Bring the first problem into view.
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]')
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
      return;
    }
    // `valid` guarantees these, but the compiler doesn't know it.
    if (!form.image || busy) return;

    const launched = await launch({
      name: form.name.trim(),
      symbol: form.symbol.trim(),
      image: form.image,
      description: "",
      website: form.website.trim() || undefined,
      twitter: form.twitter.trim() || undefined,
      telegram: form.telegram.trim() || undefined,
      devBuySol: form.devBuySol,
    });

    // Show the result here first, with the addresses in front of the user.
    if (launched) {
      setLaunched({ form });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const launchAnother = () => {
    reset();
    setLaunched(null);
    setForm(empty);
    setTouched({});
    setSubmitted(false);
  };

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const touch = (k: keyof Form) => setTouched((t) => ({ ...t, [k]: true }));

  return (
    <main className="mx-auto w-full flex-1 px-4 pt-24 pb-16 lg:px-6 xl:max-w-7xl">
      <BackLink />

      <div className="mt-4 mb-8">
        <h1 className="text-3xl drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)] sm:text-4xl">
          Launch a{" "}
          <span className="bg-brand-gradient bg-clip-text text-transparent">token</span>
        </h1>
        <p className="mt-2 max-w-2xl text-foreground/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)]">
          A fixed-supply token on a bonding curve, paired with SOL. It graduates into an AMM pool
          automatically.
        </p>
      </div>

      {result && launched ? (
        <LaunchSuccess
          result={result}
          form={launched.form}
          pricing={LAUNCH_PRICING}
          onAnother={launchAnother}
        />
      ) : (
      <form
        noValidate
        onSubmit={onSubmit}
        className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start"
      >
        <div className="flex min-w-0 flex-col gap-4">
          {/* Token */}
          <section className={cn(cardClass, "p-4 sm:p-5")}>
            <SectionTitle title="Token" description="Name, ticker and artwork. Stored permanently in the token's metadata." />
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
              <Field
                label="Token name"
                htmlFor="name"
                error={show("name")}
                counter={`${form.name.length}/${NAME_MAX}`}
              >
                <input
                  id="name"
                  value={form.name}
                  maxLength={NAME_MAX}
                  onChange={(e) => set("name", e.target.value)}
                  onBlur={() => touch("name")}
                  placeholder="Noah Wave"
                  aria-invalid={Boolean(show("name"))}
                  className={inputClass}
                />
              </Field>
              <Field
                label="Symbol"
                htmlFor="symbol"
                error={show("symbol")}
                counter={`${form.symbol.length}/${SYMBOL_MAX}`}
              >
                <input
                  id="symbol"
                  value={form.symbol}
                  maxLength={SYMBOL_MAX}
                  onChange={(e) => set("symbol", e.target.value.toUpperCase().replace(/\s+/g, ""))}
                  onBlur={() => touch("symbol")}
                  placeholder="WAVE"
                  aria-invalid={Boolean(show("symbol"))}
                  className={cn(inputClass, "font-mono uppercase")}
                />
              </Field>
            </div>

            <Field label="Token image" className="mt-4" error={null}>
              <div data-invalid={Boolean(imageError ?? show("image"))}>
              <ImageDropzone
                file={form.image}
                error={imageError ?? show("image")}
                onChange={(file, err) => {
                  set("image", file);
                  setImageError(err);
                  touch("image");
                }}
              />
              </div>
            </Field>
          </section>

          {/* Links */}
          <section className={cn(cardClass, "p-4 sm:p-5")}>
            <SectionTitle title="Project links" description="Optional. Saved in the token's permanent metadata." />
            <div className="flex flex-col gap-4">
              <Field label="Website" htmlFor="website" error={show("website")} hint="Leave blank to link to Noah.">
                <input
                  id="website"
                  type="url"
                  value={form.website}
                  onChange={(e) => set("website", e.target.value)}
                  onBlur={() => touch("website")}
                  placeholder="https://yourproject.xyz"
                  aria-invalid={Boolean(show("website"))}
                  className={inputClass}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="X / Twitter" htmlFor="twitter" error={show("twitter")}>
                  <input
                    id="twitter"
                    type="url"
                    value={form.twitter}
                    onChange={(e) => set("twitter", e.target.value)}
                    onBlur={() => touch("twitter")}
                    placeholder="https://x.com/project"
                    aria-invalid={Boolean(show("twitter"))}
                    className={inputClass}
                  />
                </Field>
                <Field label="Telegram" htmlFor="telegram" error={show("telegram")}>
                  <input
                    id="telegram"
                    type="url"
                    value={form.telegram}
                    onChange={(e) => set("telegram", e.target.value)}
                    onBlur={() => touch("telegram")}
                    placeholder="https://t.me/project"
                    aria-invalid={Boolean(show("telegram"))}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* Dev buy */}
          <section className={cn(cardClass, "p-4 sm:p-5")}>
            <SectionTitle
              title="Dev buy"
              description="Optional. Buy the pool's very first trade — bundled into the launch, so nothing can trade ahead of you."
            />
            <Field
              label="SOL amount"
              htmlFor="devBuy"
              error={show("devBuySol")}
            >
              <div className="relative">
                <input
                  id="devBuy"
                  type="text"
                  inputMode="decimal"
                  value={form.devBuySol}
                  onChange={(e) => set("devBuySol", e.target.value.replace(/[^\d.]/g, ""))}
                  onBlur={() => touch("devBuySol")}
                  placeholder="0.00"
                  aria-invalid={Boolean(show("devBuySol"))}
                  className={cn(inputClass, "pr-14 font-mono")}
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  SOL
                </span>
              </div>
            </Field>
          </section>

        </div>

        {/* Preview + summary */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <LaunchPreview form={form} pricing={LAUNCH_PRICING} />
          <LaunchSummary
            form={form}
            valid={valid}
            submitted={submitted}
            connected={connected}
            pricing={LAUNCH_PRICING}
            stage={stage}
            busy={busy}
          />
        </aside>
      </form>
      )}
    </main>
  );
}

/** Post-launch panel: what went live, where, and where to go next. */
function LaunchSuccess({
  result,
  form,
  pricing,
  onAnother,
}: {
  result: LaunchResult;
  form: Form;
  pricing: Pricing;
  onAnother: () => void;
}) {
  const [art, setArt] = useState<string | null>(null);
  useEffect(() => {
    if (!form.image) return;
    const u = URL.createObjectURL(form.image);
    setArt(u);
    return () => URL.revokeObjectURL(u);
  }, [form.image]);

  const devBuy = Number(form.devBuySol);

  return (
    <section className={cn(cardClass, "mx-auto w-full max-w-2xl overflow-hidden")}>
      <header className="flex items-start gap-4 border-b border-primary/10 bg-success/5 p-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
          <Check className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">
            {form.name.trim()} <span className="text-tide">${form.symbol.trim()}</span> is live
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Trading against SOL on its bonding curve. It graduates into an AMM pool automatically.
          </p>
        </div>
        <TokenAvatar src={art ?? undefined} name={form.name} className="size-12" />
      </header>

      <dl className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
        <Stat label="Starting market cap">
          {formatUsd(pricing.startMarketCapUsd)}
        </Stat>
        <Stat label="Quote token">
          <span className="inline-flex items-center gap-1.5">
            <TokenAvatar src={QUOTE.logo} name={QUOTE.symbol} className="size-4 rounded-full" />
            {QUOTE.symbol}
          </span>
        </Stat>
        <Stat label="Dev buy">{devBuy > 0 ? `${devBuy} SOL` : "None"}</Stat>
      </dl>

      <div className="divide-y divide-primary/10 border-t border-primary/10 px-5">
        <AddressRow label="Mint" value={result.mint} head={8} tail={8} />
        <AddressRow label="Pool" value={result.poolId} head={8} tail={8} />
        <AddressRow label="Transaction" value={result.signature} head={8} tail={8} />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-primary/10 p-5">
        <Button asChild>
          <Link to={`/token/${result.mint}`}>
            Open token page <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button variant="outline" onClick={onAnother}>
          Launch another
        </Button>
      </div>
    </section>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-subtle-foreground">{label}</dt>
      <dd className="mt-0.5 text-base font-semibold tabular-nums">{children}</dd>
    </div>
  );
}

function LaunchPreview({ form, pricing }: { form: Form; pricing: Pricing }) {
  const [url, setUrl] = useState<string | null>(null);
  // Object URL for the artwork; revoked when the file changes.
  useEffect(() => {
    if (!form.image) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(form.image);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [form.image]);
  const name = form.name.trim() || "Your token";
  const symbol = form.symbol.trim() || "TICKER";

  return (
    <section className={cn(cardClass, "p-4")}>
      <p className="mb-3 text-xs font-medium tracking-wide text-subtle-foreground uppercase">Preview</p>
      <div className="flex items-start gap-3">
        <TokenAvatar src={url ?? undefined} name={name} className="size-12" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-tide">${symbol}</span>
            <span className="text-xs text-subtle-foreground">now</span>
          </div>
          <p className="truncate text-sm text-muted-foreground">{name}</p>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-semibold tracking-tight tabular-nums">
          {formatUsd(pricing.startMarketCapUsd)}
        </p>
        <p className="mt-0.5 text-xs text-subtle-foreground">Opening market cap</p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Paired with</span>
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
          <TokenAvatar src={QUOTE.logo} name={QUOTE.symbol} className="size-4 rounded-full" />
          {QUOTE.symbol}
        </span>
        <Badge variant="outline" className="h-[18px] border-primary/15 px-1.5 text-[10px] tracking-wide uppercase">
          Noah
        </Badge>
      </div>
    </section>
  );
}

function LaunchSummary({
  form,
  valid,
  submitted,
  connected,
  pricing,
  stage,
  busy,
}: {
  form: Form;
  valid: boolean;
  submitted: boolean;
  connected: boolean;
  pricing: Pricing;
  stage: LaunchStage;
  busy: boolean;
}) {
  const quoteSymbol = QUOTE.symbol;
  const devBuy = Number(form.devBuySol);
  const canLaunch = valid && !busy;

  return (
    <section className={cn(cardClass, "p-4")}>
      <p className="mb-3 text-xs font-medium tracking-wide text-subtle-foreground uppercase">Launch summary</p>
      <dl className="divide-y divide-primary/10 text-sm">
        <Row label="Launchpad">Noah</Row>
        <Row label="Quote token">{quoteSymbol}</Row>
        <Row label="Supply">1 billion</Row>
        <Row label="Curve">Constant product</Row>
        <Row label="Raise target">{`${formatRaise(pricing.raiseUnits)} ${quoteSymbol}`}</Row>
        <Row label="Graduates at">{formatUsd(pricing.graduationMarketCapUsd)}</Row>
        <Row label="Dev buy">{devBuy > 0 ? `${devBuy} SOL` : "None"}</Row>
        <Row label="Launch fee">{LAUNCH_FEE_SOL} SOL</Row>
        <Row label="Graduation">Automatic, into an AMM pool</Row>
      </dl>

      {connected ? (
        <Button type="submit" size="lg" className="mt-4 w-full" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
          {busy ? "Launching…" : "Launch token"}
        </Button>
      ) : (
        <Button type="submit" size="lg" className="mt-4 w-full">
          <Wallet className="size-4" />
          Connect wallet
        </Button>
      )}

      {/* Live stage, so the user can see which step is running. */}
      {busy && STAGE_LABEL[stage] && (
        <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin" />
          {STAGE_LABEL[stage]}
        </p>
      )}

      {connected && submitted && !valid && !busy && (
        <p className="mt-3 text-xs text-destructive">Fix the highlighted fields to launch.</p>
      )}

      {connected && canLaunch && !submitted && (
        <p className="mt-3 text-xs text-subtle-foreground">
          Demo launch: the token is created locally and listed straight away. Nothing is sent on chain.
        </p>
      )}

      {!connected && (
        <p className="mt-3 flex items-start gap-2 text-xs text-subtle-foreground">
          <Wallet className="mt-0.5 size-3.5 shrink-0" />
          Connect a wallet — or use the demo wallet — to launch.
        </p>
      )}
    </section>
  );
}

/** Raise amounts, in SOL. */
function formatRaise(n: number) {
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 1) return n.toFixed(2);
  return n.toPrecision(3);
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}
