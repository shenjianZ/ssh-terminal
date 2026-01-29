/**
 * AI 聊天主区域组件
 *
 * 右侧聊天区域，包含消息列表和输入框
 */

import { useAIStore } from '@/store/aiStore';
import { AIChatHeader } from './AIChatHeader';
import { AIChatMessageList } from './AIChatMessageList';
import { AIChatInput } from './AIChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';

export function AIChatMain() {
  const { currentServerId } = useAIStore();

  if (!currentServerId) {
    return null;
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* 顶部信息栏 */}
      <AIChatHeader serverId={currentServerId} />

      {/* 消息列表 */}
      <ScrollArea className="flex-1">
        <AIChatMessageList serverId={currentServerId} />
      </ScrollArea>

      {/* 输入框 */}
      <div className="border-t border-border bg-background">
        <AIChatInput serverId={currentServerId} />
      </div>
    </div>
  );
}
