"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@anima/backend/convex/_generated/api";
import { useRouter } from "@/i18n/navigation";

// Must match the `type` union in packages/backend/convex/schema.ts.
const ORG_TYPES = ["spa", "shelter", "association", "informal_group"] as const;

export default function NewOrganizationPage() {
  const t = useTranslations("organizations.new");
  const router = useRouter();
  const createOrganization = useMutation(api.organizations.create);

  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof ORG_TYPES)[number]>("shelter");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(false);
    try {
      const organizationId = await createOrganization({
        name,
        type,
        country: "FR",
        address,
      });
      router.push(`/organizations/${organizationId}`);
    } catch {
      setError(true);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 font-sans dark:bg-black">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4"
      >
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          {t("title")}
        </h1>

        <label className="flex flex-col gap-1">
          {t("nameLabel")}
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded border px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          {t("typeLabel")}
          <select
            value={type}
            onChange={(event) =>
              setType(event.target.value as (typeof ORG_TYPES)[number])
            }
            className="rounded border px-3 py-2"
          >
            {ORG_TYPES.map((orgType) => (
              <option key={orgType} value={orgType}>
                {t(`type.${orgType}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          {t("countryLabel")}
          <select
            value="FR"
            onChange={() => {}}
            className="rounded border px-3 py-2"
          >
            <option value="FR">{t("country.FR")}</option>
            <option value="ES" disabled>
              {t("country.ES")}
            </option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          {t("addressLabel")}
          <input
            required
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className="rounded border px-3 py-2"
          />
        </label>

        {error && <p className="text-red-600">{t("error")}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
        >
          {isSubmitting ? t("submitting") : t("submit")}
        </button>
      </form>
    </div>
  );
}
