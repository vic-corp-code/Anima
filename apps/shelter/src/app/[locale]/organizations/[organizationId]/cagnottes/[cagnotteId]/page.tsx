"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@anima/ui";

const STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  closed: "bg-slate-200 text-slate-700",
} as const;

export default function CagnotteDetailPage() {
  const t = useTranslations("cagnottes");
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;
  const cagnotteId = params.cagnotteId as Id<"cagnottes">;
  const { isAuthenticated } = useConvexAuth();

  const cagnotte = useQuery(api.cagnottes.get, isAuthenticated ? { cagnotteId } : "skip");
  const updateCagnotte = useMutation(api.cagnottes.update);
  const updateProgress = useMutation(api.cagnottes.updateProgress);
  const closeCagnotte = useMutation(api.cagnottes.close);
  const reopenCagnotte = useMutation(api.cagnottes.reopen);

  // Edits start `null` (not yet touched, fall back to the server value)
  // to avoid syncing query results into state via an effect.
  const [titleEdit, setTitleEdit] = useState<string | null>(null);
  const [goalDescriptionEdit, setGoalDescriptionEdit] = useState<string | null>(null);
  const [targetAmountEdit, setTargetAmountEdit] = useState<string | null>(null);
  const [externalUrlEdit, setExternalUrlEdit] = useState<string | null>(null);
  const [photoUrlEdit, setPhotoUrlEdit] = useState<string | null>(null);
  const [deadlineEdit, setDeadlineEdit] = useState<string | null>(null);
  const [progressEdit, setProgressEdit] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  if (cagnotte === undefined) {
    return <div className="container mx-auto p-4">{t("loading")}</div>;
  }

  if (cagnotte === null) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">{t("notFound")}</CardContent>
        </Card>
      </div>
    );
  }

  const isClosed = cagnotte.status === "closed";
  const title = titleEdit ?? cagnotte.title;
  const goalDescription = goalDescriptionEdit ?? cagnotte.goalDescription;
  const targetAmount = targetAmountEdit ?? (cagnotte.targetAmount?.toString() ?? "");
  const externalUrl = externalUrlEdit ?? cagnotte.externalUrl;
  const photoUrl = photoUrlEdit ?? (cagnotte.photoUrl ?? "");
  const deadline = deadlineEdit ?? (cagnotte.deadline ?? "");
  const progress = progressEdit ?? cagnotte.currentAmount.toString();

  const handleSave = async () => {
    setSaveError(null);
    setIsSaving(true);
    try {
      await updateCagnotte({
        cagnotteId,
        title,
        goalDescription,
        targetAmount: targetAmount ? Number(targetAmount) : undefined,
        externalUrl,
        photoUrl: photoUrl || undefined,
        deadline: deadline || undefined,
      });
    } catch {
      setSaveError(t("error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProgress = async () => {
    setProgressError(null);
    setIsSavingProgress(true);
    try {
      await updateProgress({ cagnotteId, currentAmount: Number(progress) || 0 });
    } catch {
      setProgressError(t("error"));
    } finally {
      setIsSavingProgress(false);
    }
  };

  const handleToggleStatus = async () => {
    setTransitionError(null);
    setIsTransitioning(true);
    try {
      if (isClosed) {
        await reopenCagnotte({ cagnotteId });
      } else {
        await closeCagnotte({ cagnotteId });
      }
    } catch {
      setTransitionError(t("error"));
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/organizations/${organizationId}/cagnottes`)}
          className="mb-4"
        >
          ← {t("backToList")}
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{cagnotte.title}</h1>
          <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[cagnotte.status]}`}>
            {t(`status.${cagnotte.status}`)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("titleLabel")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("titleLabel")}</label>
              <Input
                value={title}
                onChange={(e) => setTitleEdit((e.target as HTMLInputElement).value)}
                disabled={isClosed}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("goalDescriptionLabel")}</label>
              <textarea
                value={goalDescription}
                onChange={(e) => setGoalDescriptionEdit(e.target.value)}
                disabled={isClosed}
                rows={4}
                className="w-full rounded border px-3 py-2 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("targetAmountLabel")}</label>
              <Input
                type="number"
                min="0"
                value={targetAmount}
                onChange={(e) => setTargetAmountEdit((e.target as HTMLInputElement).value)}
                disabled={isClosed}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("externalUrlLabel")}</label>
              <Input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrlEdit((e.target as HTMLInputElement).value)}
                disabled={isClosed}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("photoUrlLabel")}</label>
              <Input
                value={photoUrl}
                onChange={(e) => setPhotoUrlEdit((e.target as HTMLInputElement).value)}
                disabled={isClosed}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("deadlineLabel")}</label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadlineEdit((e.target as HTMLInputElement).value)}
                disabled={isClosed}
              />
            </div>

            {saveError && <p className="text-sm text-red-600">{saveError}</p>}
            {transitionError && <p className="text-sm text-red-600">{transitionError}</p>}
            <div className="flex gap-2">
              {!isClosed && (
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? t("saving") : t("save")}
                </Button>
              )}
              <Button variant="outline" onClick={handleToggleStatus} disabled={isTransitioning}>
                {isClosed ? t("reopen") : t("close")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t("currentAmountLabel")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="number"
              min="0"
              value={progress}
              onChange={(e) => setProgressEdit((e.target as HTMLInputElement).value)}
            />
            <Button onClick={handleSaveProgress} disabled={isSavingProgress} className="w-full">
              {isSavingProgress ? t("saving") : t("updateProgress")}
            </Button>
            {progressError && <p className="text-sm text-red-600">{progressError}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
