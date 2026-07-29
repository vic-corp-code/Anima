import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

// Presentational only — no Convex calls — so it can be reused as-is by the
// phase-2 public hub (unauthenticated context).
export interface NewsPostCardProps {
  title: string;
  text: string;
  photoUrl?: string;
  linkedAnimalsCount?: number;
  hasLinkedCagnotte?: boolean;
  linkedAnimalsIndicatorLabel?: string;
  linkedCagnotteIndicatorLabel?: string;
  onClick?: () => void;
}

export function NewsPostCard({
  title,
  text,
  photoUrl,
  linkedAnimalsCount = 0,
  hasLinkedCagnotte = false,
  linkedAnimalsIndicatorLabel,
  linkedCagnotteIndicatorLabel,
  onClick,
}: NewsPostCardProps) {
  return (
    <Card
      className={onClick ? "hover:shadow-lg transition-shadow cursor-pointer" : undefined}
      onClick={onClick}
    >
      {photoUrl && (
        <img
          src={photoUrl}
          alt={title}
          className="h-40 w-full rounded-t-xl object-cover"
        />
      )}
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm line-clamp-3 mb-2">{text}</p>
        {(linkedAnimalsCount > 0 || hasLinkedCagnotte) && (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {linkedAnimalsCount > 0 && linkedAnimalsIndicatorLabel && (
              <span className="px-2 py-1 rounded bg-gray-100">
                {linkedAnimalsIndicatorLabel}
              </span>
            )}
            {hasLinkedCagnotte && linkedCagnotteIndicatorLabel && (
              <span className="px-2 py-1 rounded bg-gray-100">
                {linkedCagnotteIndicatorLabel}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
