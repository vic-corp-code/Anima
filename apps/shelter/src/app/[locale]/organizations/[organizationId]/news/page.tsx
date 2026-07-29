"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";
import { Button, Card, CardContent, Input, NewsPostCard } from "@anima/ui";

export default function NewsListPage() {
  const t = useTranslations("news");
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;
  const { isAuthenticated } = useConvexAuth();
  const [showForm, setShowForm] = useState(false);

  const newsPosts = useQuery(
    api.newsPosts.list,
    isAuthenticated ? { organizationId } : "skip"
  );
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
                <label className="block text-sm font-medium mb-1">{t("textLabel")}</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  required
                  className="w-full rounded border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("photoUrlsLabel")}</label>
                <textarea
                  value={photoUrlsText}
                  onChange={(e) => setPhotoUrlsText(e.target.value)}
                  rows={2}
                  className="w-full rounded border px-3 py-2"
                />
              </div>
              {animals && animals.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1">{t("linkedAnimalsLabel")}</label>
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
                  <label className="block text-sm font-medium mb-1">{t("linkedCagnotteLabel")}</label>
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
              <Button type="submit" disabled={isCreating}>
                {isCreating ? t("creating") : t("create")}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {newsPosts === undefined ? (
        <p className="text-muted-foreground">{t("loading")}</p>
      ) : newsPosts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">{t("empty")}</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
