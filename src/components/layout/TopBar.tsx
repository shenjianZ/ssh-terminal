import { useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

const getBreadcrumbs = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return [{ name: 'Dashboard', path: '/' }];
  
  const breadcrumbs = [{ name: 'Home', path: '/' }];
  let currentPath = '';
  
  segments.forEach((segment) => {
    currentPath += `/${segment}`;
    const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    breadcrumbs.push({ name, path: currentPath });
  });
  
  return breadcrumbs;
};

export function TopBar() {
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <header className="h-16 bg-background border-b border-border px-6 flex items-center justify-between">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2">
        {breadcrumbs.map((breadcrumb, idx) => (
          <div key={idx} className="flex items-center">
            {idx > 0 && (
              <span className="text-muted-foreground mx-2">/</span>
            )}
            <span className="text-sm font-medium text-muted-foreground">
              {breadcrumb.name}
            </span>
          </div>
        ))}
      </nav>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Status Badges */}
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Development
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Tauri 2.0
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex gap-2 items-center">
          <ModeToggle />
          <Button variant="outline" size="sm" className="dark:bg-transparent dark:hover:bg-accent">
            <span className="mr-2">📖</span>
            Docs
          </Button>
          <Button variant="outline" size="sm" className="dark:bg-transparent dark:hover:bg-accent">
            <span className="mr-2">🔧</span>
            Settings
          </Button>
        </div>

        {/* User */}
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right">
            <p className="text-sm font-medium">Developer</p>
            <p className="text-xs text-muted-foreground">admin@example.com</p>
          </div>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              Dev
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
