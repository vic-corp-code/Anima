import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter, Geist_Mono } from "next/font/google";
import { Toaster } from "@anima/ui";
import { clerkAppearance } from "@/components/clerk-appearance";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/theme-provider";
import { AccentBootScript } from "@/components/AccentBootScript";
import { ConvexClientProvider } from "../ConvexClientProvider";
import "../globals.css";

// Body/UI font. Headline/display font is Georgia (a system font — no
// next/font loading needed, see --font-display in globals.css). Geist Mono
// stays as the code/mono font (licensing-safe SF Mono substitute).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Anima",
  description: "Shelter workspace",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <ClerkProvider appearance={clerkAppearance}>
      <ConvexClientProvider>
        <html
          lang={locale}
          suppressHydrationWarning
          className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
        >
          <body className="min-h-full flex flex-col">
            {/* Applies the saved accent before hydration (see lib/accents.ts) */}
            <AccentBootScript />
            <ThemeProvider
              attribute="data-theme"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              <NextIntlClientProvider messages={messages}>
                {children}
              </NextIntlClientProvider>
              <Toaster />
            </ThemeProvider>
          </body>
        </html>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}