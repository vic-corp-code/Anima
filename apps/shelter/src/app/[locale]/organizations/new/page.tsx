"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { api } from "@anima/backend/convex/_generated/api";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useForm,
  zodResolver,
} from "@anima/ui";

// Must match the `type` union in packages/backend/convex/schema.ts.
const ORG_TYPES = ["spa", "shelter", "association", "informal_group"] as const;

export default function NewOrganizationPage() {
  const t = useTranslations("organizations.new");
  const router = useRouter();
  const createOrganization = useMutation(api.organizations.create);

  const formSchema = z.object({
    name: z.string().trim().min(1, t("nameRequired")),
    type: z.enum(ORG_TYPES),
    // ADR-004: France-first launch. Spain stays disabled in the picker, so the
    // mutation's `country: v.literal("FR")` contract holds at the form level.
    country: z.literal("FR"),
    address: z.string().trim().min(1, t("addressRequired")),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "shelter",
      country: "FR",
      address: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(values: FormValues) {
    setIsSubmitting(true);
    setError(false);
    try {
      const organizationId = await createOrganization(values);
      router.push(`/organizations/${organizationId}`);
    } catch {
      setError(true);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background p-8 font-sans">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              noValidate
              className="flex flex-col gap-5"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("nameLabel")}</FormLabel>
                    <FormControl>
                      <Input {...field} autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>{t("typeLabel")}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="gap-2"
                      >
                        {ORG_TYPES.map((orgType) => (
                          <FormItem
                            key={orgType}
                            className="flex items-center gap-2 space-y-0"
                          >
                            <FormControl>
                              <RadioGroupItem value={orgType} />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {t(`type.${orgType}`)}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("countryLabel")}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FR">{t("country.FR")}</SelectItem>
                        <SelectItem value="ES" disabled>
                          {t("country.ES")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>{t("countryHint")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("addressLabel")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <p className="text-sm text-destructive">{t("error")}</p>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? t("submitting") : t("submit")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
