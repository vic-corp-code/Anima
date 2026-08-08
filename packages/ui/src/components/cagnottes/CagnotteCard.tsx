import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

// Presentational only — no Convex calls — so it can be reused as-is by the
// phase-2 public hub (unauthenticated context).
export interface CagnotteCardProps {
  title: string;
  goalDescription: string;
  currentAmount: number;
  targetAmount?: number;
  status: "active" | "closed" | "archived";
  statusLabel: string;
  externalUrl: string;
  externalLinkLabel: string;
  photoUrl?: string;
  onClick?: () => void;
}

const STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  closed: "bg-slate-200 text-slate-700",
  archived: "bg-slate-100 text-slate-500",
} as const;

// Shared by CagnotteCard and the cagnottes detail page — the single source
// of truth for bar width. Returns `null` (no bar) when there's no target
// to measure against, otherwise percent capped at 100.
export function computeProgressPercent(currentAmount: number, targetAmount?: number): number | null {
  return targetAmount && targetAmount > 0
    ? Math.min(100, Math.round((currentAmount / targetAmount) * 100))
    : null;
}

export function CagnotteCard({
  title,
  goalDescription,
  currentAmount,
  targetAmount,
  status,
  statusLabel,
  externalUrl,
  externalLinkLabel,
  photoUrl,
  onClick,
}: CagnotteCardProps) {
  const progressPercent = computeProgressPercent(currentAmount, targetAmount);

  return (
    <Card className={onClick ? "hover:shadow-lg transition-shadow cursor-pointer" : undefined}>
      {photoUrl && (
        <img
          src={photoUrl}
          alt={title}
          className="h-40 w-full rounded-t-xl object-cover"
        />
      )}
      <CardHeader className="pb-3" onClick={onClick}>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          <span className={`shrink-0 px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[status]}`}>
            {statusLabel}
          </span>
        </div>
      </CardHeader>
      <CardContent onClick={onClick}>
        <p className="text-sm line-clamp-2 mb-3">{goalDescription}</p>

        {targetAmount ? (
          <div className="mb-3">
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {currentAmount} / {targetAmount}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-3">{currentAmount}</p>
        )}

        <a
          href={externalUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          {externalLinkLabel}
        </a>
      </CardContent>
    </Card>
  );
}
