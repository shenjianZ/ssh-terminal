import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ElementSelector } from "@/components/devtools/ElementSelector";
import { DevToolsFloatingButton } from "@/components/devtools/DevToolsFloatingButton";
import { useDevToolsStore } from "@/store/devtoolsStore";

// 检测是否为开发环境
const isDevelopment = import.meta.env.DEV;

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const isTerminalPage = location.pathname === "/" || location.pathname === "/terminal";
  const isAIChatPage = location.pathname.startsWith("/ai-chat");
  const { isElementSelectorOpen, closeElementSelector } = useDevToolsStore();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - 始终显示 */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar - 在终端页面和 AIChatPage 隐藏 */}
        {!isTerminalPage && !isAIChatPage && <TopBar />}

        {/* Page Content */}
        <main className={cn(
          "flex-1",
          isTerminalPage || isAIChatPage ? "overflow-hidden h-full" : "bg-muted/20 overflow-y-auto custom-scrollbar"
        )}>
          {isTerminalPage || isAIChatPage ? (
            // 终端页面和 AIChatPage 全屏显示
            <div className="h-full">{children}</div>
          ) : (
            // 其他页面正常显示
            <div className="p-6">{children}</div>
          )}
        </main>
      </div>

      {/* Element Selector - 全局覆盖层（仅开发环境） */}
      {isDevelopment && isElementSelectorOpen && (
        <ElementSelector onClose={closeElementSelector} />
      )}

      {/* DevTools 浮动按钮（仅开发环境） */}
      {isDevelopment && <DevToolsFloatingButton />}
    </div>
  );
}
