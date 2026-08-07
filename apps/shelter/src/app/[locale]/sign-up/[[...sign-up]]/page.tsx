"use client";

import { SignUp } from "@clerk/nextjs";
import { useClerkAppearance } from "@/components/clerk-appearance";

export default function SignUpPage() {
  const appearance = useClerkAppearance();
  return (
    <div className="flex flex-1 items-center justify-center">
      <SignUp appearance={appearance} fallbackRedirectUrl="/organizations" />
    </div>
  );
}
