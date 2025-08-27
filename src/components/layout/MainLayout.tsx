import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-muted/20 custom-scrollbar">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
