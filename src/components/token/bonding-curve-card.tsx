import { CurveProgress, progressTier } from "@/components/tokens/curve-progress";
import { formatCompact } from "@/lib/format";
import { graduationTarget, isGraduated, type LaunchToken } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { SectionCard } from "./section-card";

export function BondingCurveCard({ token }: { token: LaunchToken }) {
  const graduated = isGraduated(token);
  const pct = graduated ? 100 : token.finishingRate;
  const tier = progressTier(pct);
  const target = graduationTarget(token);
  const raised = target != null ? (target * pct) / 100 : null;
  const quote = token.mintB.symbol;

  return (
    <SectionCard
      title="Bonding curve"
      aside={<span className={cn("font-medium", tier.text)}>{tier.label}</span>}
    >
      <CurveProgress value={pct} />

      <dl className="mt-4 divide-y divide-primary/10 text-sm">
        <Row label="Graduation limit">
          {target != null ? (
            <>
              {formatCompact(target)} <span className="text-subtle-foreground">{quote}</span>
            </>
          ) : (
            "—"
          )}
        </Row>
        <Row label={graduated ? "Raised" : "Raised so far"}>
          {raised != null ? (
            <>
              {formatCompact(raised)} <span className="text-subtle-foreground">{quote}</span>
            </>
          ) : (
            "—"
          )}
        </Row>
        {token.configInfo?.name && <Row label="Curve type">{token.configInfo.name}</Row>}
        {token.platformInfo?.name && (
          <Row label="Platform">
            {token.platformInfo.web ? (
              <a
                href={token.platformInfo.web}
                target="_blank"
                rel="noreferrer"
                className="hover:text-tide"
              >
                {token.platformInfo.name}
              </a>
            ) : (
              token.platformInfo.name
            )}
          </Row>
        )}
      </dl>
    </SectionCard>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{children}</dd>
    </div>
  );
}
