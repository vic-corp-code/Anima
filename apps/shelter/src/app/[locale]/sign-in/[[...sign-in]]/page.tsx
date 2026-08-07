"use client";

import { SignIn } from "@clerk/nextjs";
import { useClerkAppearance } from "@/components/clerk-appearance";

export default function SignInPage() {
  const appearance = useClerkAppearance();
  return (
    <div className="flex flex-1 items-center justify-center">
      <SignIn appearance={appearance} fallbackRedirectUrl="/organizations" />
    </div>
  );
}
