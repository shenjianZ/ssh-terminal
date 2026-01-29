import { useState, useEffect, useRef } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAIStore } from '@/store/aiStore';

interface AIChatInputProps {
  serverId: string;
}

export function AIChatInput({ serverId }: AIChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isServerOnline, isLoading, error } = useAIStore();
  const isOnline = isServerOnline(serverId);

  // 自动聚焦
  useEffect(() => {
    textareaRef.current?.focus();
  }, [serverId]);

  // 处理发送消息
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    try {
      await sendMessage(serverId, input.trim());
      setInput('');
    } catch (error) {
      console.error('发送失败:', error);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSend();
      }
    }
  };

  return (
    <div className="p-4 space-y-2">
      {/* 离线模式提示 */}
      {!isOnline && (
        <Alert variant="default" className="py-2 px-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            当前服务器离线。您可以继续询问通用技术问题，但无法执行服务器相关操作。
          </AlertDescription>
        </Alert>
      )}

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive" className="py-2 px-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isOnline
                ? '输入你的问题... (Enter 发送, Shift+Enter 换行)'
                : '输入消息（离线模式）... (Enter 发送, Shift+Enter 换行)'
            }
            disabled={isLoading}
            className="w-full min-h-[60px] max-h-[200px] resize-y custom-scrollbar rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            {input.length} 字符
          </div>
        </div>
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="h-[60px] w-[60px] flex-shrink-0"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
