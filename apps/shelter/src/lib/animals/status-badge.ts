import { badgeVariants } from "@anima/ui";
import type { VariantProps } from "class-variance-authority";
import type { AnimalStatus } from "@anima/domain";

// Badge tints built from kit tokens (success/warn/meta).
export const SUCCESS_TINT =
  "border-[color-mix(in_oklab,var(--success)_32%,var(--card))] bg-[color-mix(in_oklab,var(--success)_16%,var(--card))] text-[color-mix(in_oklab,var(--success)_78%,var(--foreground))]";
export const WARN_TINT =
  "border-[color-mix(in_oklab,var(--warn)_30%,var(--card))] bg-[color-mix(in_oklab,var(--warn)_14%,var(--card))] text-[color-mix(in_oklab,var(--warn)_74%,var(--foreground))]";
export const META_TINT =
  "border-[color-mix(in_oklab,var(--meta)_30%,var(--card))] bg-[color-mix(in_oklab,var(--meta)_14%,var(--card))] text-[color-mix(in_oklab,var(--meta)_74%,var(--foreground))]";
export const PRIMARY_TINT =
  "border-[color-mix(in_oklab,var(--primary)_32%,var(--card))] bg-[color-mix(in_oklab,var(--primary)_14%,var(--card))] text-[color-mix(in_oklab,var(--primary)_74%,var(--foreground))]";

export const STATUS_BADGE: Record<
  AnimalStatus,
  { variant: VariantProps<typeof badgeVariants>["variant"]; className?: string }
> = {
  in_care: { variant: "secondary" },
  adoptable: { variant: "outline", className: SUCCESS_TINT },
  adoption_pending: { variant: "outline", className: WARN_TINT },
  fostered: { variant: "outline", className: META_TINT },
  adopted: { variant: "outline" },
  transferred: { variant: "default" },
  deceased: { variant: "destructive" },
};
