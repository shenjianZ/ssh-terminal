import { useState, useEffect, useRef, useCallback } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Trash2, MessageSquare, AlertCircle, Settings, Terminal, ArrowDown, ExternalLink, Send } from 'lucide-react';
import { useAIStore } from '@/store/aiStore';
import { useTerminalStore } from '@/store/terminalStore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { AIChatMessage } from './AIChatMessage';
import { AILoadingIndicator } from './AILoadingIndicator';
import { playSound, SoundEffect } from '@/lib/sounds';

export function AIChatPanel() {
  const {
    isChatOpen,
    toggleChat,
    sendMessage,
    getConversationHistory,
    clearConversation,
    isLoading,
    streamingConnectionId,
    config,
  } = useAIStore();

  const [input, setInput] = useState('');
  const [textareaHeight, setTextareaHeight] = useState('auto');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  // 获取当前活跃的连接
  const activeTab = useTerminalStore((state) => state.getActiveTab());
  const currentConnectionId = activeTab?.connectionId || null;
  // 使用 connectionId 作为 serverId，每个连接有独立的 AI 对话历史
  const currentServerId = currentConnectionId;

  // 获取对话历史
  const messages = currentServerId ? getConversationHistory(currentServerId) : [];

  // 检查是否正在流式生成当前连接的消息
  const isStreaming = streamingConnectionId === currentServerId;

  // 计算行高的辅助函数
  const calculateHeight = useCallback(() => {
    if (!textareaRef.current) return 'auto';

    const textarea = textareaRef.current;
    const scrollHeight = textarea.scrollHeight;

    // 基础样式
    const lineHeight = 20; // 对应 text-sm 的行高
    const basePadding = 8; // 对应 p-2 的上下 padding
    const singleLineHeight = lineHeight + basePadding;

    // 最大行数：7行
    const maxLines = 7;
    const maxHeight = singleLineHeight * maxLines;

    // 如果内容高度小于等于最大高度，使用内容高度；否则使用最大高度并启用滚动
    const newHeight = Math.min(scrollHeight, maxHeight);

    return `${Math.max(newHeight, singleLineHeight)}px`;
  }, []);

  // 处理输入变化，自动调整高度
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInput(newValue);

    // 计算并设置新高度
    const newHeight = calculateHeight();
    setTextareaHeight(newHeight);
  };

  // 重置高度当清空输入时
  useEffect(() => {
    if (!input) {
      setTextareaHeight('auto');
    }
  }, [input]);

  // 检查用户是否在底部附近（100px 以内）
  const isNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;

    const threshold = 100;
    const position = container.scrollTop + container.clientHeight;
    const height = container.scrollHeight;

    return height - position < threshold;
  }, []);

  // 滚动到底部
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, []);

  // 处理滚动事件
  const handleScroll = useCallback(() => {
    const nearBottom = isNearBottom();

    // 如果不在底部，显示"回到底部"按钮
    setShowScrollToBottom(!nearBottom);

    // 标记用户正在手动滚动
    setIsUserScrolling(true);

    // 清除之前的定时器
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // 500ms 后停止标记为用户滚动
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 500);
  }, [isNearBottom]);

  // 自动滚动逻辑：只在用户没有手动滚动且在底部附近时自动滚动
  useEffect(() => {
    if (!isUserScrolling && isNearBottom()) {
      scrollToBottom(isStreaming ? 'auto' : 'smooth');
    }
  }, [messages, isLoading, isStreaming, isUserScrolling, isNearBottom, scrollToBottom]);

  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || !currentServerId) return;

    try {
      await sendMessage(currentServerId, input.trim());
      setInput('');
      setTextareaHeight('auto');
      playSound(SoundEffect.SUCCESS);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '发送失败';
      toast.error(`发送失败: ${errorMsg}`);
      playSound(SoundEffect.ERROR);
    }
  };

  // 清空历史
  const handleClear = () => {
    if (!currentServerId || messages.length === 0) return;

    toast('确定要清空聊天记录吗？', {
      action: {
        label: '确定',
        onClick: () => {
          clearConversation(currentServerId);
          toast.success('聊天记录已清空');
          playSound(SoundEffect.SUCCESS);
        },
      },
    });
  };

  // 跳转到完整页面
  const handleGoToFullPage = () => {
    navigate('/ai-chat');
    toggleChat();
  };

  // 没有连接的空状态
  const NoConnectionState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Terminal className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-2">无终端连接</h3>
      <p className="text-sm text-muted-foreground mb-4">
        请先打开一个终端连接，然后才能与 AI 对话
      </p>
    </div>
  );

  // 没有配置 AI 的空状态
  const NoConfigState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-2">未配置 AI 服务</h3>
      <p className="text-sm text-muted-foreground mb-4">
        请先在设置中配置并启用 AI Provider
      </p>
      <Button onClick={() => window.location.href = '/settings'}>
        <Settings className="h-4 w-4 mr-2" />
        前往设置
      </Button>
    </div>
  );

  // 没有消息的空状态
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <MessageSquare className="h-8 w-8 text-primary/60" />
      </div>
      <h3 className="font-semibold mb-2">开始与 AI 对话</h3>
      <p className="text-sm text-muted-foreground">
        你可以询问 Linux 命令、系统操作、脚本编写等问题
      </p>
    </div>
  );

  // 检查是否有可用的 AI Provider
  const hasEnabledProvider = config?.providers?.some((p: any) => p.enabled) ?? false;

  return (
    <Sheet open={isChatOpen} onOpenChange={toggleChat}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetTitle className="sr-only">AI 助手</SheetTitle>
        <SheetDescription className="sr-only">与 AI 助手进行对话，询问命令解释、错误分析等问题</SheetDescription>

        {/* 渐变装饰条 */}
        <div className="h-1 bg-gradient-to-r from-blue-500/40 via-purple-500/60 to-pink-500/40" />

        {/* 头部 */}
        <div className="h-14 border-b flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold">AI 助手</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoToFullPage}
              title="查看完整历史"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">完整界面</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={!currentServerId || messages.length === 0}
              title="清空聊天记录"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 聊天区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 消息列表 */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto custom-scrollbar p-4"
          >
            {!currentServerId ? (
              <NoConnectionState />
            ) : !hasEnabledProvider ? (
              <NoConfigState />
            ) : messages.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => {
                  // 检查是否是最后一条消息且正在流式生成
                  const isLastMessageStreaming = isStreaming && idx === messages.length - 1 && msg.role === 'assistant';
                  return (
                    <AIChatMessage
                      key={idx}
                      message={msg}
                      isStreaming={isLastMessageStreaming}
                    />
                  );
                })}
                {isLoading && !isStreaming && <AILoadingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* 回到底部按钮 - 固定在右下角 */}
          {showScrollToBottom && (
            <Button
              onClick={() => {
                scrollToBottom('smooth');
                setShowScrollToBottom(false);
              }}
              size="icon"
              className="absolute bottom-32 right-4 z-20 shadow-lg h-8 w-8 rounded-full bg-primary hover:bg-primary/90 animate-in fade-in slide-in-from-right-2 duration-300"
              title={isStreaming ? '查看最新' : '回到底部'}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          )}

          {/* 输入框 */}
          {currentServerId && hasEnabledProvider && (
            <div className="border-t p-4 bg-background/50">
              {/* 输入区域容器：带圆角边框 */}
              <div className="relative border border-input rounded-lg bg-background transition-all duration-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                style={{
                  minHeight: '44px',
                  maxHeight: '300px',
                }}
              >
                <div className="flex items-end gap-2 p-2 pb-6">
                  {/* 输入框 */}
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (input.trim() && !isLoading && !isStreaming) {
                          handleSend();
                        }
                      }
                    }}
                    placeholder="输入你的问题... (Enter 发送, Shift+Enter 换行)"
                    style={{
                      height: textareaHeight,
                      maxHeight: '224px', // 7行 × 32px/行 = 224px
                    }}
                    className="flex-1 min-h-[28px] resize-none bg-transparent border-0 p-0 text-sm focus-visible:outline-none focus-visible:ring-0 placeholder:text-muted-foreground overflow-y-auto custom-scrollbar"
                  />

                  {/* 发送按钮 */}
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading || isStreaming}
                    className="h-8 w-8 flex-shrink-0 rounded-full"
                    variant="default"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* 字符计数 */}
                <div className="absolute bottom-1.5 left-3 text-xs text-muted-foreground pointer-events-none">
                  {input.length} 字符
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
