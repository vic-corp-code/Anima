"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useConvexAuth, useQuery_experimental as useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { CircleX } from "lucide-react";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { Link, useRouter } from "@/i18n/navigation";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
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
import { STATUS_BADGE } from "@/lib/animals/status-badge";
import type { AnimalSpecies, AnimalStatus } from "@anima/domain";

const SPECIES_OPTIONS: AnimalSpecies[] = ["dog", "cat"];

const STATUS_OPTIONS = Object.keys(STATUS_BADGE) as AnimalStatus[];

const SKELETON_ROWS = Array.from({ length: 6 }, (_, index) => index);

export default function AnimalsListPage() {
  const t = useTranslations("animals");
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;
  const { isAuthenticated } = useConvexAuth();
  const [statusFilter, setStatusFilter] = useState<AnimalStatus | null>(null);
  const [speciesFilter, setSpeciesFilter] = useState<AnimalSpecies | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const animalsQuery = useQuery({
    query: api.animals.list,
    args: !isAuthenticated ? "skip" : { organizationId },
  });

  const animals = animalsQuery.status === "success" ? animalsQuery.data : undefined;

  const filteredAnimals = useMemo(() => {
    if (!animals) return [];
    const query = searchQuery.trim().toLowerCase();
    return animals.filter((animal) => {
      if (statusFilter && animal.status !== statusFilter) return false;
      if (speciesFilter && animal.species !== speciesFilter) return false;
      if (query) {
        return (
          animal.name.toLowerCase().includes(query) ||
          animal.breed?.toLowerCase().includes(query) ||
          animal.healthNotes?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [animals, statusFilter, speciesFilter, searchQuery]);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("list.title")}</h1>
          <p className="text-muted-foreground">{t("list.subtitle")}</p>
        </div>
        <Button
          onClick={() => router.push(`/organizations/${organizationId}/animals/new`)}
        >
          {t("list.addAnimal")}
        </Button>
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
                {t("list.statusFilterLabel")}
              </label>
              <Select
                value={statusFilter ?? "all"}
                onValueChange={(value) =>
                  setStatusFilter(value === "all" ? null : (value as AnimalStatus))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("list.allStatuses")}</SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`status.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("list.speciesFilterLabel")}
              </label>
              <Select
                value={speciesFilter ?? "all"}
                onValueChange={(value) =>
                  setSpeciesFilter(
                    value === "all" ? null : (value as AnimalSpecies)
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("list.allSpecies")}</SelectItem>
                  {SPECIES_OPTIONS.map((species) => (
                    <SelectItem key={species} value={species}>
                      {t(`list.speciesFilterOption.${species}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {animalsQuery.status === "error" ? (
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
                  <TableHead>{t("list.colName")}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("list.colSpecies")}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("list.colSex")}
                  </TableHead>
                  <TableHead>{t("list.colStatus")}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("list.colSterilized")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {animalsQuery.status === "pending" || !animals ? (
                  SKELETON_ROWS.map((index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="size-10 rounded-md" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-3.5 w-32" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-3.5 w-16" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-3.5 w-14" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-3.5 w-10" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredAnimals.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      {animals.length === 0
                        ? t("list.emptyNone")
                        : t("list.emptyFiltered")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAnimals.map((animal) => {
                    const badge = STATUS_BADGE[animal.status];
                    return (
                      <TableRow
                        key={animal._id}
                        className="cursor-pointer"
                        onClick={() =>
                          router.push(
                            `/organizations/${organizationId}/animals/${animal._id}`
                          )
                        }
                      >
                        <TableCell>
                          {animal.photoUrls[0] ? (
                            <div className="relative size-10 overflow-hidden rounded-md">
                              <Image
                                src={animal.photoUrls[0]}
                                alt={t("show.gallery.alt", {
                                  name: animal.name,
                                  index: 1,
                                })}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="size-10 rounded-md bg-muted" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Link
                            className="font-medium hover:underline"
                            href={`/organizations/${organizationId}/animals/${animal._id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {animal.name}
                          </Link>
                          {animal.breed && (
                            <div className="text-xs text-muted-foreground">
                              {animal.breed}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {t(`species.${animal.species}`)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {t(`sex.${animal.sex}`)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant} className={badge.className}>
                            {t(`status.${animal.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {animal.sterilized ? t("yes") : t("no")}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
