// Public library entry for react-docs-ui-vite
// Expose components, utilities, and types for consumers

// Ensure styles are bundled and available for consumers
import "./index.css"

// Simple Buffer polyfill for browser environments
// if (typeof window !== 'undefined' && !(window as any).Buffer) {
//   (window as any).Buffer = {
//     from: (data: any) => new Uint8Array(data),
//     isBuffer: (obj: any) => obj instanceof Uint8Array,
//     alloc: (size: number) => new Uint8Array(size),
//     allocUnsafe: (size: number) => new Uint8Array(size)
//   };
// }

// Core layout components
export { DocsLayout } from "./components/DocsLayout"
export { HeaderNav } from "./components/HeaderNav"
export { SidebarNav } from "./components/SidebarNav"
export { TableOfContents } from "./components/TableOfContents"
export { Footer } from "./components/Footer"

// Theming
export { ThemeProvider, useTheme } from "./components/theme-provider"
export { ModeToggle } from "./components/mode-toggle"
export { LanguageSwitcher } from "./components/LanguageSwitcher"

// Primitives (re-export selected UI components)
export { ScrollArea } from "./components/ui/scroll-area"
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip"
export { buttonVariants } from "./components/ui/button"
export {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./components/ui/collapsible"
export { Separator } from "./components/ui/separator"
export { Badge } from "./components/ui/badge"
export { Label } from "./components/ui/label"
export { Command, CommandDialog } from "./components/ui/command"
export {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "./components/ui/context-menu"
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog"
export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu"

// Markdown renderer
export { MdxContent } from "./components/MdxContent"

// Library utilities and types
export { cn } from "./lib/utils"
export { getConfig } from "./lib/config"
export type { SiteConfig } from "./lib/config"

// Ready-to-use app
export { DocsApp } from "./app/DocsApp"


