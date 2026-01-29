/**
 * AI 聊天主区域组件
 *
 * 右侧聊天区域，包含消息列表和输入框
 */

import { useAIStore } from '@/store/aiStore';
import { AIChatHeader } from './AIChatHeader';
import { AIChatMessageList } from './AIChatMessageList';
import { AIChatInput } from './AIChatInput';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AIChatMainProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function AIChatMain({ sidebarOpen, setSidebarOpen }: AIChatMainProps) {
  const { currentServerId } = useAIStore();

  if (!currentServerId) {
    return null;
  }

  // 阻止滚轮事件传播
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="h-full flex flex-col w-full">
      {/* 顶部信息栏 - 包含 toggle 按钮 */}
      <div className="shrink-0 flex items-center border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="ml-2 h-8 w-8 shrink-0"
          title={sidebarOpen ? '收起侧边栏' : '展开侧边栏'}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
        <div className="flex-1 min-w-0">
          <AIChatHeader serverId={currentServerId} />
        </div>
      </div>

      {/* 消息列表 - 独立滚动区域 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ touchAction: 'pan-y' }} onWheel={handleWheel}>
        <AIChatMessageList serverId={currentServerId} />
      </div>

      {/* 输入框 */}
      <div className="shrink-0 border-t border-border bg-background">
        <AIChatInput serverId={currentServerId} />
      </div>
    </div>
  );
}
