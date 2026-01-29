/**
 * AI 聊天消息列表组件
 *
 * 显示 AI 对话的消息历史
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAIStore } from '@/store/aiStore';
import { ChatMessage } from '@/types/ai';
import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface AIChatMessageListProps {
  serverId: string;
}

export function AIChatMessageList({ serverId }: AIChatMessageListProps) {
  const { conversations, isLoading, streamingConnectionId } = useAIStore();
  const messages = conversations.get(serverId) || [];
  const scrollRef = useRef<HTMLDivElement>(null);
  const isStreaming = streamingConnectionId === serverId;

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, serverId]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px] p-6 text-center">
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
    <div className="flex flex-col min-h-full">
      {messages.map((message, index) => {
        // 检查是否是最后一条消息且正在流式生成
        const isLastMessageStreaming = isStreaming && index === messages.length - 1 && message.role === 'assistant';
        return (
          <MessageBubble
            key={index}
            message={message}
            isStreaming={isLastMessageStreaming}
          />
        );
      })}

      {isStreaming && messages.length === 0 && (
        <div className="flex items-start gap-3 px-6 py-4">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 flex items-center gap-1">
            <span className="w-1.5 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1 bg-primary rounded-full animate-bounce" />
          </div>
        </div>
      )}

      <div ref={scrollRef} />
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isEmpty = !message.content || message.content.trim().length === 0;

  return (
    <div
      className={cn(
        'flex items-start px-6 py-4',
        isUser ? 'justify-end' : 'justify-start',
        isStreaming && !isUser && 'animate-in fade-in slide-in-from-bottom-2 duration-300'
      )}
    >
      <div className={cn('flex gap-3 max-w-[80%]', isUser ? 'flex-row-reverse' : 'flex-row items-start')}>
        {/* 头像 */}
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            isUser ? 'bg-primary' : isStreaming ? 'bg-primary/20' : 'bg-primary/10',
            isStreaming && !isUser ? 'animate-pulse' : ''
          )}
        >
          {isUser ? (
            <User className="w-4 h-4 text-primary-foreground" />
          ) : (
            <Bot className={cn('h-4 w-4 text-primary', isStreaming && 'animate-pulse')} />
          )}
        </div>

        {/* 消息气泡 */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 shadow-sm relative',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : isStreaming
                ? 'bg-muted/80 text-foreground rounded-bl-sm border border-primary/20'
                : 'bg-muted text-foreground rounded-bl-sm border',
            isStreaming && !isUser && 'animate-in fade-in duration-200'
          )}
        >
          {isUser ? (
            // 用户消息：纯文本
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          ) : (
            // AI 消息：支持 Markdown
            <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
              {isEmpty && isStreaming ? (
                // 空内容时显示占位符
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1 bg-primary rounded-full animate-bounce" />
                </div>
              ) : (
                <>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // 代码块样式
                      pre: ({ node, ...props }) => (
                        <pre
                          className="bg-background rounded-md p-3 overflow-x-auto text-xs border border-border"
                          {...props}
                        />
                      ),
                      // 行内代码样式
                      code: ({ className, ...props }: any) =>
                        className?.includes('language-') ? (
                          <code className={className} {...props} />
                        ) : (
                          <code
                            className="bg-background rounded px-1.5 py-0.5 text-xs font-mono border border-border"
                            {...props}
                          />
                        ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>

                  {/* 流式光标 */}
                  {isStreaming && !isEmpty && (
                    <span className="inline-flex items-center ml-1">
                      <span className="relative flex h-4 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75" />
                        <span className="relative inline-flex rounded-full h-4 w-1.5 bg-primary" />
                      </span>
                    </span>
                  )}
                </>
              )}
            </div>
          )}

          {/* 流式状态指示器 */}
          {isStreaming && !isUser && (
            <div className="absolute -bottom-1 -right-1">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
