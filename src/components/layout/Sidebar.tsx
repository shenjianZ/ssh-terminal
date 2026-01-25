import { NavLink } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Terminal,
  FolderOpen,
  HardDrive,
  Settings,
  LucideIcon,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { useSidebarStore } from "@/store/sidebarStore";
import { cn } from "@/lib/utils";

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
    title: "连接",
    items: [
      { name: "终端", path: "/terminal", icon: Terminal },
      { name: "会话管理", path: "/sessions", icon: FolderOpen },
    ]
  },
  {
    title: "工具",
    items: [
      { name: "文件管理器", path: "/sftp", icon: HardDrive },
    ]
  },
  {
    title: "配置",
    items: [
      { name: "设置", path: "/settings", icon: Settings },
    ]
  },
];

export function Sidebar() {
  const { isCollapsed, toggleSidebar } = useSidebarStore();

  return (
    <aside
      className={cn(
        "bg-card border-r border-border h-screen flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="h-16 border-b border-border flex items-center justify-between px-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {!isCollapsed && (
            <>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Terminal className="h-5 w-5 text-primary" />
              </div>
              <h1 className="font-bold text-lg whitespace-nowrap overflow-hidden">SSH Terminal</h1>
            </>
          )}
        </div>

        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 flex-shrink-0"
          onClick={toggleSidebar}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className={cn(
          "p-4 space-y-6 transition-all duration-300",
          isCollapsed && "px-2"
        )}>
          {navigationItems.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                  {section.title}
                </h3>
              )}
              <ul className={cn(
                "space-y-1",
                isCollapsed && "space-y-2"
              )}>
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center rounded-lg transition-all relative overflow-hidden",
                          isCollapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )
                      }
                      title={isCollapsed ? item.name : undefined}
                    >
                      <item.icon className={cn(
                        "flex-shrink-0",
                        isCollapsed ? "h-5 w-5" : "h-4 w-4"
                      )} />
                      {!isCollapsed && (
                        <span className="text-sm font-medium whitespace-nowrap overflow-hidden">{item.name}</span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
              {sectionIndex < navigationItems.length - 1 && !isCollapsed && (
                <Separator className="my-4" />
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Status Section */}
      <div className="p-4 border-t border-border">
        <div className={cn(
          "text-xs text-muted-foreground",
          isCollapsed ? "text-center" : ""
        )}>
          {!isCollapsed ? "SSH Ready" : "🔌"}
        </div>
      </div>
    </aside>
  );
}
