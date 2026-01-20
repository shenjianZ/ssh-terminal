import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Bell } from "lucide-react";

const getPageTitle = (pathname: string): string => {
  const titles: Record<string, string> = {
    '/': '终端',
    '/terminal': '终端',
    '/sessions': '会话管理',
    '/settings': '设置',
  };
  return titles[pathname] || 'SSH Terminal';
};

export function TopBar() {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="h-16 bg-background border-b border-border px-6 flex items-center justify-between">
      {/* Page Title */}
      <h1 className="text-xl font-semibold">{pageTitle}</h1>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost">
          <Bell className="h-4 w-4" />
        </Button>
        <ModeToggle />
      </div>
    </header>
  );
}
