"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Progress,
  Skeleton,
  Textarea,
  computeProgressPercent,
} from "@anima/ui";

// Kit tag semantics (EXTRACTION.md §1): active = success, closed = neutral
// secondary, archived = meta (the 5th tag color, no shadcn slot — tinted).
const STATUS_BADGE: Record<"active" | "closed" | "archived", string | undefined> = {
  active: "bg-success/10 text-success dark:bg-success/20",
  closed: undefined,
  archived: "bg-meta/10 text-meta dark:bg-meta/20",
};

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
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
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

  const progressPercent = computeProgressPercent(cagnotte.currentAmount, cagnotte.targetAmount);

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
          <Badge variant="secondary" className={STATUS_BADGE[cagnotte.status]}>
            {t(`status.${cagnotte.status}`)}
          </Badge>
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
              <Textarea
                value={goalDescription}
                onChange={(e) => setGoalDescriptionEdit(e.target.value)}
                disabled={isClosed}
                rows={4}
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

            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
            {transitionError && <p className="text-sm text-destructive">{transitionError}</p>}
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
            {progressPercent !== null && (
              <div className="space-y-1 pb-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-2xl font-semibold">{cagnotte.currentAmount}</span>
                  <span className="text-sm text-muted-foreground">
                    {t("progressOf")} {cagnotte.targetAmount}
                  </span>
                </div>
                <Progress value={progressPercent} />
                <p className="text-right text-xs text-muted-foreground">{progressPercent}%</p>
              </div>
            )}
            <Input
              type="number"
              min="0"
              value={progress}
              onChange={(e) => setProgressEdit((e.target as HTMLInputElement).value)}
            />
            <Button onClick={handleSaveProgress} disabled={isSavingProgress} className="w-full">
              {isSavingProgress ? t("saving") : t("updateProgress")}
            </Button>
            {progressError && <p className="text-sm text-destructive">{progressError}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
