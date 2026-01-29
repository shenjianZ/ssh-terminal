/**
 * AI 聊天页面布局组件
 *
 * 提供左侧边栏（服务器列表）和右侧聊天区域的布局
 */

import { useAIStore } from '@/store/aiStore';
import { AIChatSidebar } from './AIChatSidebar';
import { AIChatMain } from './AIChatMain';

interface AIChatLayoutProps {
  onNewChat: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function AIChatLayout({ onNewChat, sidebarOpen, setSidebarOpen }: AIChatLayoutProps) {
  const { currentServerId } = useAIStore();

  // 阻止滚轮事件传播
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="relative h-full w-full overflow-hidden flex">
      {/* 左侧边栏：服务器分组历史 - 固定定位 */}
      {sidebarOpen && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-80 border-r border-border bg-muted/10 z-10 flex flex-col" onWheel={handleWheel}>
            <AIChatSidebar onNewChat={onNewChat} />
          </div>
          <div className="absolute left-80 top-0 bottom-0 w-px bg-border z-10" />
        </>
      )}

      {/* 右侧：聊天区域 - 固定定位或根据侧边栏调整左边距 */}
      <div className={`flex-1 flex flex-col overflow-hidden ${sidebarOpen ? 'ml-80' : ''}`} onWheel={handleWheel}>
        {currentServerId ? (
          <AIChatMain sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div className="max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">开始新的对话</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="text-primary hover:underline"
                  >
                    打开侧边栏
                  </button>
                )}
                {sidebarOpen ? '从左侧选择一个服务器，或创建新对话' : '点击上方按钮打开侧边栏选择服务器'}
              </p>
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  打开侧边栏
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
