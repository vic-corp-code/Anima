"use client";

import { useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { Button, Input } from "@anima/ui";

interface VerificationCardProps {
  organizationId: Id<"organizations">;
  verificationStatus: "unverified" | "email_verified" | "registry_verified";
  registryNumber?: string;
}

// Client sub-component so the rest of the org page can stay a server
// component — this is the only part that needs live mutations + the
// caller's admin role.
export function VerificationCard({
  organizationId,
  verificationStatus,
  registryNumber,
}: VerificationCardProps) {
  const t = useTranslations("organizations.show");
  const { isAuthenticated } = useConvexAuth();

  const membership = useQuery(
    api.memberships.listForOrg,
    isAuthenticated ? { organizationId } : "skip"
  );
  const isAdmin = membership?.callerRole === "admin";

  const updateRegistryNumber = useMutation(api.organizations.updateRegistryNumber);
  const markVerified = useMutation(api.organizations.markVerified);
  const unmarkVerified = useMutation(api.organizations.unmarkVerified);

  const [registryNumberEdit, setRegistryNumberEdit] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registryNumberValue = registryNumberEdit ?? registryNumber ?? "";
  const isVerified = verificationStatus === "registry_verified";

  const handleSaveRegistryNumber = async () => {
    setIsSaving(true);
    try {
      await updateRegistryNumber({ organizationId, registryNumber: registryNumberValue });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkVerified = async () => {
    setError(null);
    setIsTransitioning(true);
    try {
      await markVerified({ organizationId });
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
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded border border-zinc-300 p-4 dark:border-zinc-700">
      <h2 className="mb-2 font-medium">{t("verificationTitle")}</h2>
      <p className="mb-3 text-sm">{t(`verificationStatus.${verificationStatus}`)}</p>

      {isAdmin && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="registryNumber">
            {t("registryNumberLabel")}
          </label>
          <div className="flex gap-2">
            <Input
              id="registryNumber"
              value={registryNumberValue}
              onChange={(e) => setRegistryNumberEdit((e.target as HTMLInputElement).value)}
            />
            <Button onClick={handleSaveRegistryNumber} disabled={isSaving}>
              {isSaving ? t("registryNumberSaving") : t("registryNumberSave")}
            </Button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {isVerified ? (
            <Button variant="outline" onClick={handleUnmarkVerified} disabled={isTransitioning}>
              {t("unmarkVerified")}
            </Button>
          ) : (
            <Button variant="outline" onClick={handleMarkVerified} disabled={isTransitioning}>
              {t("markVerified")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
