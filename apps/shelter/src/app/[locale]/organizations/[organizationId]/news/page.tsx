"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  useConvexAuth,
  useMutation,
  useQuery,
  useQuery_experimental,
} from "convex/react";
import { useTranslations } from "next-intl";
import { CircleX } from "lucide-react";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  Input,
  NewsPostCard,
  Skeleton,
  Textarea,
} from "@anima/ui";

const SKELETON_COUNT = 6;

export default function NewsListPage() {
  const t = useTranslations("news");
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;
  const { isAuthenticated } = useConvexAuth();
  const [showForm, setShowForm] = useState(false);

  const newsPostsQuery = useQuery_experimental({
    query: api.newsPosts.list,
    args: isAuthenticated ? { organizationId } : "skip",
  });
  const newsPosts =
    newsPostsQuery.status === "success" ? newsPostsQuery.data : undefined;
  const animals = useQuery(
    api.animals.list,
    isAuthenticated ? { organizationId } : "skip"
  );
  const cagnottes = useQuery(
    api.cagnottes.list,
    isAuthenticated ? { organizationId } : "skip"
  );
  const createNewsPost = useMutation(api.newsPosts.create);

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [photoUrlsText, setPhotoUrlsText] = useState("");
  const [linkedAnimalIds, setLinkedAnimalIds] = useState<Id<"animals">[]>([]);
  const [linkedCagnotteId, setLinkedCagnotteId] = useState<Id<"cagnottes"> | "">("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle("");
    setText("");
    setPhotoUrlsText("");
    setLinkedAnimalIds([]);
    setLinkedCagnotteId("");
  };

  const toggleAnimal = (animalId: Id<"animals">) => {
    setLinkedAnimalIds((prev) =>
      prev.includes(animalId) ? prev.filter((id) => id !== animalId) : [...prev, animalId]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);
    try {
      const photoUrls = photoUrlsText
        .split("\n")
        .map((url) => url.trim())
        .filter(Boolean);

      await createNewsPost({
        organizationId,
        title,
        text,
        photoUrls,
        linkedAnimalIds,
        linkedCagnotteId: linkedCagnotteId || undefined,
      });
      resetForm();
      setShowForm(false);
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
        <Button onClick={() => setShowForm((v) => !v)}>{t("create")}</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">{t("titleLabel")}</label>
                <Input value={title} onChange={(e) => setTitle((e.target as HTMLInputElement).value)} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t("textLabel")}</label>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t("photoUrlsLabel")}</label>
                <Textarea
                  value={photoUrlsText}
                  onChange={(e) => setPhotoUrlsText(e.target.value)}
                  rows={2}
                />
              </div>
              {animals && animals.length > 0 && (
                <div>
                  <label className="mb-1 block text-sm font-medium">{t("linkedAnimalsLabel")}</label>
                  <div className="flex flex-wrap gap-3">
                    {animals.map((animal) => (
                      <label key={animal._id} className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={linkedAnimalIds.includes(animal._id)}
                          onChange={() => toggleAnimal(animal._id)}
                          className="rounded"
                        />
                        {animal.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {cagnottes && cagnottes.length > 0 && (
                <div>
                  <label className="mb-1 block text-sm font-medium">{t("linkedCagnotteLabel")}</label>
                  <select
                    value={linkedCagnotteId}
                    onChange={(e) => setLinkedCagnotteId(e.target.value as Id<"cagnottes"> | "")}
                    className="w-full rounded border px-3 py-2"
                  >
                    <option value="">{t("noCagnotte")}</option>
                    {cagnottes.map((cagnotte) => (
                      <option key={cagnotte._id} value={cagnotte._id}>
                        {cagnotte.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {createError && <p className="text-sm text-destructive">{createError}</p>}
              <Button type="submit" disabled={isCreating}>
                {isCreating ? t("creating") : t("create")}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {newsPostsQuery.status === "error" ? (
        <Alert variant="destructive">
          <CircleX className="size-4" aria-hidden="true" />
          <AlertTitle>{t("errorTitle")}</AlertTitle>
          <AlertDescription>{t("errorDescription")}</AlertDescription>
        </Alert>
      ) : newsPosts === undefined ? (
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
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
      ) : newsPosts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">{t("empty")}</CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
          {newsPosts.map((post) => (
            <NewsPostCard
              key={post._id}
              title={post.title}
              text={post.text}
              photoUrl={post.photoUrls[0]}
              linkedAnimalsCount={post.linkedAnimalIds?.length ?? 0}
              hasLinkedCagnotte={!!post.linkedCagnotteId}
              linkedAnimalsIndicatorLabel={t("linkedAnimalsIndicator", {
                count: post.linkedAnimalIds?.length ?? 0,
              })}
              linkedCagnotteIndicatorLabel={t("linkedCagnotteIndicator")}
              onClick={() => router.push(`/organizations/${organizationId}/news/${post._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
