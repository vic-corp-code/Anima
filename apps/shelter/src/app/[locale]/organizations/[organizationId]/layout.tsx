"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Id } from "@anima/backend/convex/_generated/dataModel";
import { OrgNav } from "./OrgNav";
import { OrgChat } from "@/components/chat/OrgChat";
import { Button } from "@anima/ui";

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;
  const [chatOpen, setChatOpen] = useState(false);
  const t = useTranslations("orgChat");

  return (
    <div className="flex min-h-screen">
      <OrgNav />
      <main className="flex-1 pb-16 md:pb-4">{children}</main>

      {/* Floating chat button */}
      <Button
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        onClick={() => setChatOpen(!chatOpen)}
      >
        {chatOpen ? "✕" : "💬"}
      </Button>

      {/* Chat panel */}
      {chatOpen && (
        <div className="fixed bottom-36 right-4 z-50 h-[500px] w-[360px] max-w-[calc(100vw-2rem)] rounded-lg border bg-white shadow-xl dark:bg-zinc-900 md:bottom-20">
          <OrgChat organizationId={organizationId} />
        </div>
      )}
    </div>
  );
}
