"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";
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
  Skeleton,
  Textarea,
} from "@anima/ui";

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
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </CardContent>
        </Card>
      </div>
    );
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
          <ChevronLeft className="size-4" aria-hidden="true" /> {t("backToList")}
        </Button>
        <h1 className="text-2xl font-bold">{post.title}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("titleLabel")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t("titleLabel")}</label>
            <Input value={title} onChange={(e) => setTitleEdit((e.target as HTMLInputElement).value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("textLabel")}</label>
            <Textarea
              value={text}
              onChange={(e) => setTextEdit(e.target.value)}
              rows={6}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("photoUrlsLabel")}</label>
            <Textarea
              value={photoUrlsText}
              onChange={(e) => setPhotoUrlsEdit(e.target.value)}
              rows={2}
            />
          </div>

          {post.linkedAnimals.length > 0 && (
            <div>
              <span className="mb-1 block text-sm font-medium">{t("linkedAnimalsLabel")}</span>
              <div className="flex flex-wrap gap-2">
                {post.linkedAnimals.map((animal) => (
                  <Badge key={animal._id} variant="secondary">
                    {animal.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {post.linkedCagnotte && (
            <div>
              <span className="mb-1 block text-sm font-medium">{t("linkedCagnotteLabel")}</span>
              <Badge variant="secondary">{post.linkedCagnotte.title}</Badge>
            </div>
          )}

          {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? t("saving") : t("save")}
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/10"
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
