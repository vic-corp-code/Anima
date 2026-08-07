import { Card, CardContent } from "@anima/ui";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  description?: string;
  icon: LucideIcon;
}

// Dashboard stat card per EXTRACTION.md §3 (dashboard.html): Card + uppercase
// micro-label + 36px/600 value + optional description line, icon tile on the
// left. Pure presentational — server-safe, no hooks.
export function StatCard({ label, value, description, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
            {label}
          </p>
          <p className="text-4xl font-semibold tracking-[-0.02em] tabular-nums">{value}</p>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
