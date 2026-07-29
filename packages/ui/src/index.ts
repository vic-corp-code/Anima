// Shared design system — cards, forms, layout used across apps/shelter, apps/hub, apps/volunteers.
// The compact card formats (announcement, cagnotte, mission) belong here once they exist.

export { cn } from "./lib/utils"

export { Button, buttonVariants } from "./components/ui/button"
export { Input } from "./components/ui/input"
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./components/ui/card"

export { AnimalChat } from "./components/animals/AnimalChat"
export { AnimalForm } from "./components/animals/AnimalForm"
export { PhotoUpload } from "./components/animals/PhotoUpload"
export { AnnouncementCard } from "./components/announcements/AnnouncementCard"
export type { AnnouncementCardProps } from "./components/announcements/AnnouncementCard"
export { CagnotteCard } from "./components/cagnottes/CagnotteCard"
export type { CagnotteCardProps } from "./components/cagnottes/CagnotteCard"
