"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@anima/backend/convex/_generated/api";
import { useRouter, Link } from "@/i18n/navigation";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@anima/ui";

export default function InvitePage() {
  const t = useTranslations("invite");
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { isAuthenticated } = useConvexAuth();

  const invite = useQuery(api.invites.getByToken, { token });
  const acceptInvite = useMutation(api.invites.accept);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState(false);

  const handleAccept = async () => {
    setAccepting(true);
    setError(false);
    try {
      const organizationId = await acceptInvite({ token });
      router.push(`/organizations/${organizationId}`);
    } catch {
      setError(true);
    } finally {
      setAccepting(false);
    }
  };

  if (invite === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center p-4" aria-busy="true">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3.5 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      </main>
    );
  }

  if (invite === null) {
    return (
      <main className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("invalid")}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>
            {t("invitedTo")} <strong className="font-medium text-card-foreground">{invite.organizationName}</strong>{" "}
            {t("asRole")}{" "}
            <Badge variant="secondary" className="align-middle">
              {t(`role.${invite.role}`)}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {error && <p className="text-sm text-destructive">{t("acceptError")}</p>}
          {isAuthenticated ? (
            <Button onClick={handleAccept} disabled={accepting} className="w-full">
              {accepting ? t("accepting") : t("accept")}
            </Button>
          ) : (
            <Button asChild className="w-full">
              <Link
                href={`/sign-in?redirect_url=${encodeURIComponent(`/invite/${token}`)}`}
              >
                {t("signInToAccept")}
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
