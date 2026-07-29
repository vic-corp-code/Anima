"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@anima/ui";

export default function NewsPostDetailPage() {
  const t = useTranslations("news");
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;
  const newsPostId = params.newsPostId as Id<"newsPosts">;
  const { isAuthenticated } = useConvexAuth();

  const post = useQuery(api.newsPosts.get, isAuthenticated ? { newsPostId } : "skip");
  const updateNewsPost = useMutation(api.newsPosts.update);
  const removeNewsPost = useMutation(api.newsPosts.remove);

  // Edits start `null` (not yet touched, fall back to the server value) to
  // avoid syncing query results into state via an effect.
  const [titleEdit, setTitleEdit] = useState<string | null>(null);
  const [textEdit, setTextEdit] = useState<string | null>(null);
  const [photoUrlsEdit, setPhotoUrlsEdit] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (post === undefined) {
    return <div className="container mx-auto p-4">{t("loading")}</div>;
  }

  if (post === null) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">{t("notFound")}</CardContent>
        </Card>
      </div>
    );
  }

  const title = titleEdit ?? post.title;
  const text = textEdit ?? post.text;
  const photoUrlsText = photoUrlsEdit ?? post.photoUrls.join("\n");

  const handleSave = async () => {
    setSaveError(null);
    setIsSaving(true);
    try {
      const photoUrls = photoUrlsText
        .split("\n")
        .map((url) => url.trim())
        .filter(Boolean);
      await updateNewsPost({ newsPostId, title, text, photoUrls });
    } catch {
      setSaveError(t("error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t("deleteConfirm"))) return;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await removeNewsPost({ newsPostId });
      router.push(`/organizations/${organizationId}/news`);
    } catch {
      setDeleteError(t("error"));
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/organizations/${organizationId}/news`)}
          className="mb-4"
        >
          ← {t("backToList")}
        </Button>
        <h1 className="text-2xl font-bold">{post.title}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("titleLabel")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("titleLabel")}</label>
            <Input value={title} onChange={(e) => setTitleEdit((e.target as HTMLInputElement).value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("textLabel")}</label>
            <textarea
              value={text}
              onChange={(e) => setTextEdit(e.target.value)}
              rows={6}
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("photoUrlsLabel")}</label>
            <textarea
              value={photoUrlsText}
              onChange={(e) => setPhotoUrlsEdit(e.target.value)}
              rows={2}
              className="w-full rounded border px-3 py-2"
            />
          </div>

          {post.linkedAnimals.length > 0 && (
            <div>
              <span className="block text-sm font-medium mb-1">{t("linkedAnimalsLabel")}</span>
              <div className="flex flex-wrap gap-2">
                {post.linkedAnimals.map((animal) => (
                  <span key={animal._id} className="px-2 py-1 rounded bg-gray-100 text-sm">
                    {animal.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {post.linkedCagnotte && (
            <div>
              <span className="block text-sm font-medium mb-1">{t("linkedCagnotteLabel")}</span>
              <span className="px-2 py-1 rounded bg-gray-100 text-sm">
                {post.linkedCagnotte.title}
              </span>
            </div>
          )}

          {saveError && <p className="text-sm text-red-600">{saveError}</p>}
          {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? t("saving") : t("save")}
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:bg-red-50"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {t("delete")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
