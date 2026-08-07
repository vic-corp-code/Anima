"use client";

import { useState } from "react";
import { useParams, useSelectedLayoutSegment } from "next/navigation";
import { useTranslations } from "next-intl";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import {
  Button,
  Sheet,
  SheetContent,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
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
  { key: "overview", path: "", icon: "🏠" },
  { key: "animals", path: "animals", icon: "🐾" },
  { key: "announcements", path: "announcements", icon: "📢" },
  { key: "cagnottes", path: "cagnottes", icon: "💰" },
  { key: "news", path: "news", icon: "📰" },
  { key: "members", path: "members", icon: "👥" },
] as const;

function OrganizationSidebar() {
  const t = useTranslations("organizations.nav");
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;
  const segment = useSelectedLayoutSegment();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
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
                      <span className="text-base leading-none">{item.icon}</span>
                      <span>{t(item.key)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
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

      {/* Floating chat button */}
      <Button
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        onClick={() => setChatOpen(!chatOpen)}
      >
        {chatOpen ? "✕" : "💬"}
      </Button>

      {/* Chat panel — right-hand drawer; the toggle button above stays the
          single source of truth for open state */}
      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-sm">
          <OrgChat organizationId={organizationId} />
        </SheetContent>
      </Sheet>
    </SidebarProvider>
  );
}
