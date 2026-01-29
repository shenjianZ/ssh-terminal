/**
 * AI 聊天消息列表组件
 *
 * 显示 AI 对话的消息历史
 */

import { useAIStore } from '@/store/aiStore';
import { ChatMessage } from '@/types/ai';
import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface AIChatMessageListProps {
  serverId: string;
}

export function AIChatMessageList({ serverId }: AIChatMessageListProps) {
  const { conversations, isLoading, streamingServerId } = useAIStore();
  const messages = conversations.get(serverId) || [];
  const scrollRef = useRef<HTMLDivElement>(null);
  const isStreaming = streamingServerId === serverId;

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, serverId]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">开始新的对话</h3>
          <p className="text-sm text-muted-foreground">
            输入您的问题，AI 助手会帮助您解答
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {messages.map((message, index) => (
        <MessageBubble key={index} message={message} />
      ))}

      {isStreaming && (
        <div className="flex items-start gap-3 px-6 py-4">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      )}

      <div ref={scrollRef} />
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-6 py-4',
        isUser ? 'bg-muted/30' : 'bg-background'
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded flex items-center justify-center flex-shrink-0',
          isUser ? 'bg-primary' : 'bg-primary/10'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-primary" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">
            {isUser ? '您' : 'AI 助手'}
          </span>
        </div>
        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    </div>
  );
}
