import { Badge, Button, Card, CardAction, CardContent, CardHeader, CardTitle } from "@anima/ui";
import { HeartHandshake, Stethoscope } from "lucide-react";
import { Link } from "@/i18n/navigation";

export interface UrgentNeedItem {
  kind: "cagnotte" | "animal";
  title: string;
  meta: string;
  priority: "urgent" | "high";
  href: string;
}

interface UrgentNeedsCardProps {
  items: UrgentNeedItem[];
  title: string;
  emptyText: string;
  createCagnotteLabel: string;
  cagnottesHref: string;
  priorityUrgentLabel: string;
  priorityHighLabel: string;
}

// Kit alarm semantics (EXTRACTION.md §1): destructive (red) = "Urgent",
// warn (orange) = "Prioritaire" — same pairing as the mockup's need priorities.
const PRIORITY_BADGE: Record<UrgentNeedItem["priority"], string | undefined> = {
  urgent: "bg-destructive/10 text-destructive dark:bg-destructive/20",
  high: "bg-warn/10 text-warn dark:bg-warn/20",
};

// "Besoins urgents" section — derived from existing data (cagnottes under
// their goal, animals with health notes), never authored. Pure presentational,
// server-safe; the page feeds it pre-computed items.
export function UrgentNeedsCard({
  items,
  title,
  emptyText,
  createCagnotteLabel,
  cagnottesHref,
  priorityUrgentLabel,
  priorityHighLabel,
}: UrgentNeedsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link href={cagnottesHref}>{createCagnotteLabel}</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {items.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-4 rounded-lg p-2 hover:bg-muted/50"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground">
                {item.kind === "cagnotte" ? (
                  <HeartHandshake className="size-5" aria-hidden="true" />
                ) : (
                  <Stethoscope className="size-5" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium group-hover:underline">{item.title}</p>
                <p className="truncate text-sm text-muted-foreground">{item.meta}</p>
              </div>
              <Badge variant="secondary" className={PRIORITY_BADGE[item.priority]}>
                {item.priority === "urgent" ? priorityUrgentLabel : priorityHighLabel}
              </Badge>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
