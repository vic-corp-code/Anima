"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@anima/ui";

const ROLE_OPTIONS = ["admin", "editor"] as const;
type Role = (typeof ROLE_OPTIONS)[number];

export default function MembersPage() {
  const t = useTranslations("members");
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;
  const { isAuthenticated } = useConvexAuth();

  const data = useQuery(
    api.memberships.listForOrg,
    isAuthenticated ? { organizationId } : "skip"
  );
  const updateRole = useMutation(api.memberships.updateRole);
  const removeMember = useMutation(api.memberships.remove);
  const createInvite = useMutation(api.invites.create);

  const [inviteRole, setInviteRole] = useState<Role>("editor");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const handleRoleChange = async (membershipId: Id<"memberships">, role: Role) => {
    setRoleError(null);
    try {
      await updateRole({ membershipId, role });
    } catch {
      setRoleError(t("error"));
    }
  };

  const handleRemove = async (membershipId: Id<"memberships">) => {
    if (!window.confirm(t("removeConfirm"))) return;
    setRemoveError(null);
    try {
      await removeMember({ membershipId });
    } catch {
      setRemoveError(t("error"));
    }
  };

  const handleGenerateInvite = async () => {
    setInviteError(null);
    try {
      const token = await createInvite({ organizationId, role: inviteRole });
      setInviteLink(`${window.location.origin}/invite/${token}`);
      setCopied(false);
    } catch {
      setInviteError(t("error"));
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
  };

  if (data === undefined) {
    return <div className="container mx-auto p-4">{t("loading")}</div>;
  }

  const isAdmin = data.callerRole === "admin";

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <Card>
        <CardContent className="pt-6">
          <table className="w-full text-sm">
            <tbody>
              {data.members.map((member) => (
                <tr key={member.membershipId} className="border-b last:border-0">
                  <td className="py-2">
                    <div className="font-medium">{member.name}</div>
                    <div className="text-muted-foreground">{member.email}</div>
                  </td>
                  <td className="py-2">
                    {isAdmin ? (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member.membershipId, e.target.value as Role)
                        }
                        className="rounded border px-2 py-1"
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {t(`role.${role}`)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      t(`role.${member.role}`)
                    )}
                  </td>
                  {isAdmin && (
                    <td className="py-2 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemove(member.membershipId)}
                      >
                        {t("remove")}
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {roleError && <p className="text-sm text-red-600 mt-2">{roleError}</p>}
          {removeError && <p className="text-sm text-red-600 mt-2">{removeError}</p>}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>{t("generateInvite")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">{t("inviteRoleLabel")}</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
                className="rounded border px-2 py-1"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {t(`role.${role}`)}
                  </option>
                ))}
              </select>
              <Button onClick={handleGenerateInvite}>{t("generateInvite")}</Button>
            </div>
            {inviteError && <p className="text-sm text-red-600">{inviteError}</p>}
            {inviteLink && (
              <div className="flex items-center gap-2">
                <Input value={inviteLink} readOnly className="flex-1" />
                <Button variant="outline" onClick={handleCopy}>
                  {copied ? t("copied") : t("copy")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
