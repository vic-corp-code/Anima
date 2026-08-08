"use client";

import { useState } from "react";
import { useParams, useSelectedLayoutSegment } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import {
  Home,
  Moon,
  PawPrint,
  Megaphone,
  Sun,
  Wallet,
  Newspaper,
  Users,
  MessageCircle,
} from "lucide-react";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import {
  Button,
  Sheet,
  SheetContent,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@anima/ui";
import { OrgChat } from "@/components/chat/OrgChat";
import { Link } from "@/i18n/navigation";

// Single source of truth for the org nav: adding a real feature later is
// exactly one entry here — the mapping below handles label, link and
// active state, no styling work required.
const NAV_ITEMS = [
  { key: "overview", path: "", icon: Home },
  { key: "animals", path: "animals", icon: PawPrint },
  { key: "announcements", path: "announcements", icon: Megaphone },
  { key: "cagnottes", path: "cagnottes", icon: Wallet },
  { key: "news", path: "news", icon: Newspaper },
  { key: "members", path: "members", icon: Users },
] as const;

function OrganizationSidebar() {
  const t = useTranslations("organizations.nav");
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;
  const segment = useSelectedLayoutSegment();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
            <PawPrint className="size-4" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Anima</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        item.path === "" ? segment === null : segment === item.path
                      }
                      onClick={() => setOpenMobile(false)}
                      className="rounded-md before:absolute before:top-2 before:bottom-2 before:left-0 before:w-[3px] before:rounded-full before:bg-primary before:opacity-0 data-[active=true]:before:opacity-100"
                    >
                      <Link
                        href={`/organizations/${organizationId}${
                          item.path ? `/${item.path}` : ""
                        }`}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                        <span>{t(item.key)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}

function ThemeToggle() {
  const t = useTranslations("theme");
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-full justify-start gap-2"
      aria-label={t("toggle")}
    >
      {isDark ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
      <span>{t(isDark ? "light" : "dark")}</span>
    </Button>
  );
}

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <SidebarProvider>
      <OrganizationSidebar />
      <SidebarInset className="pb-4">
        <header className="flex h-14 shrink-0 items-center border-b border-border px-4 md:hidden">
          <SidebarTrigger className="-ml-2" />
        </header>
        {children}
      </SidebarInset>

      {/* Floating chat button — opens the drawer; the Sheet owns its close */}
      <Button
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        aria-label="Chat"
        onClick={() => setChatOpen(true)}
      >
        <MessageCircle className="size-6" />
      </Button>

      {/* Chat panel — right-hand drawer */}
      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent
          side="right"
          className="data-[side=right]:w-full gap-0 p-0"
        >
          <OrgChat organizationId={organizationId} />
        </SheetContent>
      </Sheet>
    </SidebarProvider>
  );
}
