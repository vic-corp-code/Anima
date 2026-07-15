import { auth } from "@clerk/nextjs/server";

export default async function OrganizationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await auth.protect();
  return children;
}
