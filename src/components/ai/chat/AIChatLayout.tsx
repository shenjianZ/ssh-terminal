/**
 * AI 聊天页面布局组件
 *
 * 提供左侧边栏（服务器列表）和右侧聊天区域的布局
 */

import { useAIStore } from '@/store/aiStore';
import { AIChatSidebar } from './AIChatSidebar';
import { AIChatMain } from './AIChatMain';
import { Separator } from '@/components/ui/separator';

interface AIChatLayoutProps {
  onNewChat: () => void;
}

export function AIChatLayout({ onNewChat }: AIChatLayoutProps) {
  const { currentServerId } = useAIStore();

  return (
    <div className="flex h-full w-full">
      {/* 左侧边栏：服务器分组历史 */}
      <div className="w-80 border-r border-border flex flex-col bg-muted/10">
        <AIChatSidebar onNewChat={onNewChat} />
      </div>

      <Separator orientation="vertical" />

      {/* 右侧：聊天区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {currentServerId ? (
          <AIChatMain />
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div className="max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">开始新的对话</h3>
              <p className="text-sm text-muted-foreground mb-4">
                从左侧选择一个服务器，或创建新对话
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
