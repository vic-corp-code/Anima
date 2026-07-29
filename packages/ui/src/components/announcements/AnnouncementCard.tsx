import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

// Presentational only — no Convex calls — so it can be reused as-is by the
// phase-2 public hub (unauthenticated context).
export interface AnnouncementCardProps {
  title: string;
  description: string;
  status: "draft" | "published" | "closed";
  statusLabel: string;
  animalName: string;
  animalSpeciesLabel: string;
  photoUrl?: string;
  onClick?: () => void;
}

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-800",
  published: "bg-green-100 text-green-800",
  closed: "bg-slate-200 text-slate-700",
} as const;

export function AnnouncementCard({
  title,
  description,
  status,
  statusLabel,
  animalName,
  animalSpeciesLabel,
  photoUrl,
  onClick,
}: AnnouncementCardProps) {
  return (
    <Card
      className={onClick ? "hover:shadow-lg transition-shadow cursor-pointer" : undefined}
      onClick={onClick}
    >
      {photoUrl && (
        <img
          src={photoUrl}
          alt={animalName}
          className="h-40 w-full rounded-t-xl object-cover"
        />
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          <span className={`shrink-0 px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[status]}`}>
            {statusLabel}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {animalName} • {animalSpeciesLabel}
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-sm line-clamp-3">{description}</p>
      </CardContent>
    </Card>
  );
}
