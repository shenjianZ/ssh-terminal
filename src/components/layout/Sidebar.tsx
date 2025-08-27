import { NavLink } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Home, 
  Star, 
  Palette, 
  Layout, 
  CheckCircle2, 
  Zap,
  LucideIcon
} from "lucide-react";

interface NavigationItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

const navigationItems: NavigationSection[] = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", path: "/", icon: Home },
      { name: "Features", path: "/features", icon: Star },
    ]
  },
  {
    title: "Components",
    items: [
      { name: "UI Components", path: "/components", icon: Palette },
      { name: "Layout", path: "/layout", icon: Layout },
      // Removed: Forms, Navigation
    ]
  },
  // Removed: Development and Resources sections per request
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-card border-r border-border h-screen overflow-y-auto sticky top-0 custom-scrollbar">
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">T</span>
          </div>
          <div>
            <h1 className="font-bold text-lg">Tauri Template</h1>
            <Badge variant="secondary" className="text-xs">v2.0.0</Badge>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-6">
        {navigationItems.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        isActive
                          ? "border-2 border-black text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      }`
                    }
                                     >
                     <item.icon className="w-5 h-5" />
                     {item.name}
                   </NavLink>
                </li>
              ))}
            </ul>
            {sectionIndex < navigationItems.length - 1 && (
              <Separator className="my-4" />
            )}
          </div>
        ))}
      </nav>

             {/* Status Section */}
       <div className="p-4 border-t border-border mt-auto">
         <div className="space-y-3">
           <div className="flex items-center gap-2 text-sm">
             <CheckCircle2 className="w-4 h-4 text-green-500" />
             <span className="text-muted-foreground">Ready for Development</span>
           </div>
           <div className="flex items-center gap-2 text-sm">
             <Zap className="w-4 h-4 text-blue-500" />
             <span className="text-muted-foreground">Hot Reload Active</span>
           </div>
         </div>
       </div>
    </aside>
  );
}
