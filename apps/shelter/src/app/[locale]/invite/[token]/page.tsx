"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@anima/backend/convex/_generated/api";
import { useRouter, Link } from "@/i18n/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@anima/ui";

export default function InvitePage() {
  const t = useTranslations("invite");
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { isAuthenticated } = useConvexAuth();

  const invite = useQuery(api.invites.getByToken, { token });
  const acceptInvite = useMutation(api.invites.accept);
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const organizationId = await acceptInvite({ token });
      router.push(`/organizations/${organizationId}`);
    } finally {
      setAccepting(false);
    }
  };

  if (invite === undefined) {
    return <div className="container mx-auto p-4">{t("loading")}</div>;
  }

  if (invite === null) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("invalid")}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md p-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            {t("invitedTo")} <strong>{invite.organizationName}</strong>{" "}
            {t("asRole")} {t(`role.${invite.role}`)}
          </p>
          {isAuthenticated ? (
            <Button onClick={handleAccept} disabled={accepting} className="w-full">
              {accepting ? t("accepting") : t("accept")}
            </Button>
          ) : (
            <Link
              href={`/sign-in?redirect_url=${encodeURIComponent(`/invite/${token}`)}`}
              className="block w-full rounded bg-black px-4 py-2 text-center text-white dark:bg-zinc-50 dark:text-black"
            >
              {t("signInToAccept")}
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
