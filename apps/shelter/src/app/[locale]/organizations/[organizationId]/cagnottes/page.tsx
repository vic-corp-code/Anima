"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";
import {
  Button,
  CagnotteCard,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Textarea,
  useForm,
} from "@anima/ui";

const STATUS_OPTIONS = ["active", "closed", "archived"] as const;
type Status = (typeof STATUS_OPTIONS)[number];

interface CagnotteFormValues {
  title: string;
  goalDescription: string;
  targetAmount: string;
  currentAmount: string;
  externalUrl: string;
  photoUrl: string;
  deadline: string;
}

const SKELETON_COUNT = 6;

export default function CagnottesListPage() {
  const t = useTranslations("cagnottes");
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;
  const { isAuthenticated } = useConvexAuth();
  const [statusFilter, setStatusFilter] = useState<Status | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const cagnottes = useQuery(
    api.cagnottes.list,
    !isAuthenticated
      ? "skip"
      : statusFilter
      ? { organizationId, status: statusFilter }
      : { organizationId }
  );
  const createCagnotte = useMutation(api.cagnottes.create);

  const form = useForm<CagnotteFormValues>({
    defaultValues: {
      title: "",
      goalDescription: "",
      targetAmount: "",
      currentAmount: "",
      externalUrl: "",
      photoUrl: "",
      deadline: "",
    },
  });

  const handleCreate = async (values: CagnotteFormValues) => {
    setCreateError(null);
    setIsCreating(true);
    try {
      await createCagnotte({
        organizationId,
        title: values.title,
        goalDescription: values.goalDescription,
        targetAmount: values.targetAmount ? Number(values.targetAmount) : undefined,
        currentAmount: values.currentAmount ? Number(values.currentAmount) : undefined,
        externalUrl: values.externalUrl,
        photoUrl: values.photoUrl || undefined,
        deadline: values.deadline || undefined,
      });
      form.reset();
      setDialogOpen(false);
    } catch {
      setCreateError(t("error"));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>{t("create")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("dialogTitle")}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("titleLabel")}</FormLabel>
                      <FormControl>
                        <Input {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="goalDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("goalDescriptionLabel")}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder={t("goalDescriptionPlaceholder")}
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="targetAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("targetAmountLabel")}</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("currentAmountLabel")}</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("deadlineLabel")}</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="externalUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("externalUrlLabel")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder={t("externalUrlPlaceholder")}
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("photoUrlLabel")}</FormLabel>
                      <FormControl>
                        <Input {...field} type="url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {createError && <p className="text-sm text-destructive">{createError}</p>}
                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setDialogOpen(false)}
                    disabled={isCreating}
                  >
                    {t("cancel")}
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? t("creating") : t("create")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <label className="mb-1 block text-sm font-medium">{t("statusFilterLabel")}</label>
          <Select
            value={statusFilter ?? "all"}
            onValueChange={(value) =>
              setStatusFilter(value === "all" ? null : (value as Status))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`status.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {cagnottes === undefined ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <Card key={index}>
              <CardContent className="space-y-3 pt-6">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : cagnottes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">{t("empty")}</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
