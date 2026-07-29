"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";
import { Button, CagnotteCard, Card, CardContent, Input } from "@anima/ui";

const STATUS_OPTIONS = ["active", "closed"] as const;
type Status = (typeof STATUS_OPTIONS)[number];

export default function CagnottesListPage() {
  const t = useTranslations("cagnottes");
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;
  const { isAuthenticated } = useConvexAuth();
  const [statusFilter, setStatusFilter] = useState<Status | null>(null);
  const [showForm, setShowForm] = useState(false);

  const cagnottes = useQuery(
    api.cagnottes.list,
    !isAuthenticated
      ? "skip"
      : statusFilter
      ? { organizationId, status: statusFilter }
      : { organizationId }
  );
  const createCagnotte = useMutation(api.cagnottes.create);

  const [title, setTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const resetForm = () => {
    setTitle("");
    setGoalDescription("");
    setTargetAmount("");
    setExternalUrl("");
    setPhotoUrl("");
    setDeadline("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await createCagnotte({
        organizationId,
        title,
        goalDescription,
        targetAmount: targetAmount ? Number(targetAmount) : undefined,
        externalUrl,
        photoUrl: photoUrl || undefined,
        deadline: deadline || undefined,
      });
      resetForm();
      setShowForm(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>{t("create")}</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t("titleLabel")}</label>
                <Input value={title} onChange={(e) => setTitle((e.target as HTMLInputElement).value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("goalDescriptionLabel")}</label>
                <textarea
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  placeholder={t("goalDescriptionPlaceholder")}
                  rows={3}
                  required
                  className="w-full rounded border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("targetAmountLabel")}</label>
                <Input
                  type="number"
                  min="0"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount((e.target as HTMLInputElement).value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("externalUrlLabel")}</label>
                <Input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl((e.target as HTMLInputElement).value)}
                  placeholder={t("externalUrlPlaceholder")}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("photoUrlLabel")}</label>
                <Input value={photoUrl} onChange={(e) => setPhotoUrl((e.target as HTMLInputElement).value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("deadlineLabel")}</label>
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline((e.target as HTMLInputElement).value)}
                />
              </div>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? t("creating") : t("create")}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardContent className="pt-6">
          <label className="block text-sm font-medium mb-1">{t("statusFilterLabel")}</label>
          <select
            value={statusFilter ?? ""}
            onChange={(e) => setStatusFilter((e.target.value || null) as Status | null)}
            className="w-full rounded border px-3 py-2"
          >
            <option value="">{t("allStatuses")}</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {t(`status.${status}`)}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {cagnottes === undefined ? (
        <p className="text-muted-foreground">{t("loading")}</p>
      ) : cagnottes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">{t("empty")}</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cagnottes.map((cagnotte) => (
            <CagnotteCard
              key={cagnotte._id}
              title={cagnotte.title}
              goalDescription={cagnotte.goalDescription}
              currentAmount={cagnotte.currentAmount}
              targetAmount={cagnotte.targetAmount}
              status={cagnotte.status}
              statusLabel={t(`status.${cagnotte.status}`)}
              externalUrl={cagnotte.externalUrl}
              externalLinkLabel={t("externalLinkLabel")}
              photoUrl={cagnotte.photoUrl}
              onClick={() => router.push(`/organizations/${organizationId}/cagnottes/${cagnotte._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
