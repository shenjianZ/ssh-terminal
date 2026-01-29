import { useState } from 'react';
import { Menu, Terminal, Settings, Smartphone, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { useNavigate, useLocation } from 'react-router-dom';
import { isMobileDevice } from '@/lib/utils';

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { id: 'home', label: '会话', icon: Server, path: '/' },
    { id: 'terminal', label: '终端', icon: Terminal, path: '/terminal' },
    { id: 'settings', label: '设置', icon: Settings, path: '/settings' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  // 检测是否为移动端设备
  const isMobile = isMobileDevice();

  if (!isMobile) {
    return <div>{children}</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-x-hidden">
      {/* 顶部导航栏 */}
      <header className="border-b bg-card sticky top-0 z-50 safe-area-top flex-shrink-0">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Smartphone className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">SSH Terminal</h1>
          </div>

          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 touch-manipulation">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>菜单</SheetTitle>
                <SheetDescription>导航菜单，选择要访问的功能页面</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col p-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? "secondary" : "ghost"}
                      className="justify-start mb-1 h-12 touch-manipulation"
                      onClick={() => handleNavigation(item.path)}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {item.label}
                    </Button>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="flex-1 overflow-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}