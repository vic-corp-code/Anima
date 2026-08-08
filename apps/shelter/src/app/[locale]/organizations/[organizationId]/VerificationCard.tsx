"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  useForm,
} from "@anima/ui";

interface VerificationCardProps {
  organizationId: Id<"organizations">;
  verificationStatus: "unverified" | "email_verified" | "registry_verified";
  registryNumber?: string;
}

type VerificationStatus = VerificationCardProps["verificationStatus"];

// Kit pill semantics (EXTRACTION.md §1): neutral/muted = unverified,
// warn (orange) = in progress, success (green) = fully verified.
const BADGE_CLASSES: Record<VerificationStatus, string | undefined> = {
  unverified: undefined,
  email_verified: "bg-warn/10 text-warn dark:bg-warn/20",
  registry_verified: "bg-success/10 text-success dark:bg-success/20",
};

// Client sub-component so the rest of the org page can stay a server
// component — this is the only part that needs live mutations + the
// caller's admin role.
export function VerificationCard({
  organizationId,
  verificationStatus,
  registryNumber,
}: VerificationCardProps) {
  const t = useTranslations("organizations.show");
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();

  const membership = useQuery(
    api.memberships.listForOrg,
    isAuthenticated ? { organizationId } : "skip"
  );
  const isAdmin = membership?.callerRole === "admin";

  const updateRegistryNumber = useMutation(api.organizations.updateRegistryNumber);
  const markVerified = useMutation(api.organizations.markVerified);
  const unmarkVerified = useMutation(api.organizations.unmarkVerified);

  // Last value this card persisted; source of truth for re-edit + display so
  // a save doesn't wait on router.refresh() to propagate the prop.
  const [savedRegistryNumber, setSavedRegistryNumber] = useState(registryNumber);

  const form = useForm<{ registryNumber: string }>({
    defaultValues: { registryNumber: savedRegistryNumber ?? "" },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isVerified = verificationStatus === "registry_verified";

  const startEditing = () => {
    setError(null);
    form.reset({ registryNumber: savedRegistryNumber ?? "" });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSaveRegistryNumber = async (values: { registryNumber: string }) => {
    setIsSaving(true);
    try {
      const trimmed = values.registryNumber.trim();
      await updateRegistryNumber({ organizationId, registryNumber: trimmed });
      setSavedRegistryNumber(trimmed);
      setIsEditing(false);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkVerified = async () => {
    setError(null);
    setIsTransitioning(true);
    try {
      await markVerified({ organizationId });
      router.refresh();
    } catch {
      setError(t("markVerifiedRequiresNumber"));
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleUnmarkVerified = async () => {
    setIsTransitioning(true);
    try {
      await unmarkVerified({ organizationId });
      router.refresh();
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("verificationTitle")}</CardTitle>
        <CardAction>
          <Badge
            variant="secondary"
            className={BADGE_CLASSES[verificationStatus]}
          >
            {t(`verificationStatus.${verificationStatus}`)}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isEditing ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSaveRegistryNumber)}
              className="flex flex-col gap-3"
            >
              <FormField
                control={form.control}
                name="registryNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("registryNumberLabel")}</FormLabel>
                    <FormControl>
                      <Input {...field} autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? t("registryNumberSaving") : t("registryNumberSave")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={cancelEditing}
                  disabled={isSaving}
                >
                  {t("registryNumberCancel")}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{t("registryNumberLabel")}</p>
              <p className="truncate font-medium">
                {savedRegistryNumber || (
                  <span className="font-normal text-muted-foreground">
                    {t("registryNumberEmpty")}
                  </span>
                )}
              </p>
            </div>
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={startEditing}>
                {t("registryNumberEdit")}
              </Button>
            )}
          </div>
        )}

        {isAdmin && (
          <div className="flex flex-col gap-2 border-t pt-3">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {isVerified ? (
              <Button variant="outline" size="sm" onClick={handleUnmarkVerified} disabled={isTransitioning}>
                {t("unmarkVerified")}
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handleMarkVerified} disabled={isTransitioning}>
                {t("markVerified")}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
