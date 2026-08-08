"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useConvexAuth, useMutation, useQuery_experimental as useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { CircleX, UserPlus } from "lucide-react";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Badge,
  badgeVariants,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@anima/ui";
import type { VariantProps } from "class-variance-authority";

const ROLE_OPTIONS = ["admin", "editor"] as const;
type Role = (typeof ROLE_OPTIONS)[number];

const ROLE_BADGE: Record<
  Role,
  VariantProps<typeof badgeVariants>["variant"]
> = {
  admin: "default",
  editor: "secondary",
};

const SKELETON_ROWS = Array.from({ length: 6 }, (_, index) => index);

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function MembersPage() {
  const t = useTranslations("members");
  const locale = useLocale();
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;
  const { isAuthenticated } = useConvexAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<Role>("editor");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const membersQuery = useQuery({
    query: api.memberships.listForOrg,
    args: !isAuthenticated ? "skip" : { organizationId },
  });

  const data = membersQuery.status === "success" ? membersQuery.data : undefined;
  const isAdmin = data?.callerRole === "admin";

  const invitesQuery = useQuery({
    query: api.invites.listForOrg,
    args: !isAuthenticated || !isAdmin ? "skip" : { organizationId },
  });

  const updateRole = useMutation(api.memberships.updateRole);
  const removeMember = useMutation(api.memberships.remove);
  const createInvite = useMutation(api.invites.create);
  const revokeInvite = useMutation(api.invites.revoke);

  const pendingInvites =
    invitesQuery.status === "success" ? invitesQuery.data : undefined;

  const filteredMembers = useMemo(() => {
    if (!data) return [];
    const query = searchQuery.trim().toLowerCase();
    return data.members.filter((member) => {
      if (roleFilter && member.role !== roleFilter) return false;
      if (query) {
        return (
          member.name.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [data, roleFilter, searchQuery]);

  const filteredInvites = useMemo(() => {
    if (!pendingInvites) return [];
    return pendingInvites.filter((invite) => {
      if (roleFilter && invite.role !== roleFilter) return false;
      if (searchQuery.trim()) return false;
      return true;
    });
  }, [pendingInvites, roleFilter, searchQuery]);

  const handleRoleChange = async (
    membershipId: Id<"memberships">,
    role: Role
  ) => {
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

  const handleRevokeInvite = async (inviteId: Id<"invites">) => {
    setRevokeError(null);
    try {
      await revokeInvite({ inviteId });
    } catch {
      setRevokeError(t("error"));
    }
  };

  const handleGenerateInvite = async () => {
    setInviteError(null);
    setGenerating(true);
    try {
      const token = await createInvite({ organizationId, role: inviteRole });
      setInviteLink(`${window.location.origin}/invite/${token}`);
      setCopied(false);
    } catch {
      setInviteError(t("invite.error"));
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
  };

  const renderRoleCell = (role: Role, membershipId: Id<"memberships">) => {
    if (isAdmin) {
      return (
        <Select
          value={role}
          onValueChange={(value) => handleRoleChange(membershipId, value as Role)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {t(`role.${option}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return <Badge variant={ROLE_BADGE[role]}>{t(`role.${role}`)}</Badge>;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("list.title")}</h1>
          <p className="text-muted-foreground">{t("list.subtitle")}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setInviteOpen(true)}>
            {t("list.inviteMember")}
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                {t("list.searchLabel")}
              </label>
              <Input
                placeholder={t("list.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("list.roleFilterLabel")}
              </label>
              <Select
                value={roleFilter ?? "all"}
                onValueChange={(value) =>
                  setRoleFilter(value === "all" ? null : (value as Role))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("list.allRoles")}</SelectItem>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role} value={role}>
                      {t(`role.${role}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {membersQuery.status === "error" ? (
        <Alert variant="destructive">
          <CircleX className="size-4" aria-hidden="true" />
          <AlertTitle>{t("list.errorTitle")}</AlertTitle>
          <AlertDescription>{t("list.errorDescription")}</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14" />
                  <TableHead>{t("list.colMember")}</TableHead>
                  <TableHead>{t("list.colRole")}</TableHead>
                  {isAdmin && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {membersQuery.status === "pending" || !data ? (
                  SKELETON_ROWS.map((index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="size-10 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-3.5 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Skeleton className="h-8 w-16" />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : filteredMembers.length === 0 &&
                  filteredInvites.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 4 : 3}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      {data.members.length === 0 &&
                      (!pendingInvites || pendingInvites.length === 0)
                        ? t("list.emptyNone")
                        : t("list.emptyFiltered")}
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.membershipId}>
                        <TableCell>
                          <Avatar size="lg">
                            <AvatarFallback>
                              {getInitials(member.name) || "?"}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {member.name || t("list.unknownMember")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {member.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {renderRoleCell(member.role, member.membershipId)}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemove(member.membershipId)}
                            >
                              {t("remove")}
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {isAdmin &&
                      filteredInvites.map((invite) => (
                        <TableRow key={invite.inviteId} className="opacity-70">
                          <TableCell>
                            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                              <UserPlus
                                className="size-4 text-muted-foreground"
                                aria-hidden="true"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {t("invitePending")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Intl.DateTimeFormat(locale, {
                                dateStyle: "medium",
                              }).format(invite.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={ROLE_BADGE[invite.role]}>
                              {t(`role.${invite.role}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeInvite(invite.inviteId)}
                            >
                              {t("revoke")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {(roleError || removeError || revokeError) && (
        <Alert variant="destructive" className="mt-4">
          <CircleX className="size-4" aria-hidden="true" />
          <AlertDescription>
            {roleError ?? removeError ?? revokeError}
          </AlertDescription>
        </Alert>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("invite.title")}</DialogTitle>
            <DialogDescription>{t("invite.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("invite.roleLabel")}
              </label>
              <Select
                value={inviteRole}
                onValueChange={(value) => setInviteRole(value as Role)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role} value={role}>
                      {t(`role.${role}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {inviteError && (
              <Alert variant="destructive">
                <CircleX className="size-4" aria-hidden="true" />
                <AlertDescription>{inviteError}</AlertDescription>
              </Alert>
            )}
            {inviteLink && (
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t("invite.linkLabel")}
                </label>
                <div className="flex items-center gap-2">
                  <Input value={inviteLink} readOnly className="flex-1" />
                  <Button variant="outline" onClick={handleCopy}>
                    {copied ? t("invite.copied") : t("invite.copy")}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleGenerateInvite} disabled={generating}>
              {t("invite.generate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
