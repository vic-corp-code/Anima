// Shared design system — cards, forms, layout used across apps/shelter, apps/hub, apps/volunteers.
// The compact card formats (announcement, cagnotte, mission) belong here once they exist.

export { cn } from "./lib/utils"

export {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertAction,
} from "./components/ui/alert"
export { Button, buttonVariants } from "./components/ui/button"
export { Input } from "./components/ui/input"
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from "./components/ui/card"

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
} from "./components/ui/avatar"
export { Badge, badgeVariants } from "./components/ui/badge"
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "./components/ui/breadcrumb"
export { Checkbox } from "./components/ui/checkbox"
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog"
export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./components/ui/dropdown-menu"
export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
  useFormField,
} from "./components/ui/form"
export { Label } from "./components/ui/label"
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./components/ui/pagination"
export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./components/ui/popover"
export { Progress } from "./components/ui/progress"
export { RadioGroup, RadioGroupItem } from "./components/ui/radio-group"
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select"
export { Separator } from "./components/ui/separator"
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "./components/ui/sheet"
export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "./components/ui/sidebar"
export { Skeleton } from "./components/ui/skeleton"
export { Toaster } from "./components/ui/sonner"
export { Switch } from "./components/ui/switch"
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./components/ui/table"
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsListVariants,
} from "./components/ui/tabs"
export { Textarea } from "./components/ui/textarea"
export { Toggle, toggleVariants } from "./components/ui/toggle"
export { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group"
export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./components/ui/tooltip"
export { useIsMobile } from "./hooks/use-mobile"

export { AnimalForm } from "./components/animals/AnimalForm"
export { PhotoUpload } from "./components/animals/PhotoUpload"
export { AnnouncementCard } from "./components/announcements/AnnouncementCard"
export type { AnnouncementCardProps } from "./components/announcements/AnnouncementCard"
export { CagnotteCard } from "./components/cagnottes/CagnotteCard"
export type { CagnotteCardProps } from "./components/cagnottes/CagnotteCard"
export { computeProgressPercent } from "./components/cagnottes/CagnotteCard"
export { NewsPostCard } from "./components/news/NewsPostCard"
export type { NewsPostCardProps } from "./components/news/NewsPostCard"
