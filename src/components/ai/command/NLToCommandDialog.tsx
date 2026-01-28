// 自然语言转命令悬浮面板（Warp 风格）

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Wand2, Terminal, X, RefreshCw } from 'lucide-react';
import { AIClient } from '@/lib/ai/aiClient';
import { useAIStore } from '@/store/aiStore';
import { toast } from 'sonner';
import { playSound } from '@/lib/sounds';
import { SoundEffect } from '@/lib/sounds';
import { cn } from '@/lib/utils';

interface NLToCommandPanelProps {
  show?: boolean;
  open?: boolean; // 别名，兼容不同的命名习惯
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void; // 别名，兼容不同的命名习惯
  onConfirm: (command: string) => void;
  connectionId: string;
}

export function NLToCommandPanel({
  show,
  open,
  onClose,
  onOpenChange,
  onConfirm,
  connectionId: _connectionId, // eslint-disable-line @typescript-eslint/no-unused-vars
}: NLToCommandPanelProps) {
  // 兼容不同的 prop 命名
  const isVisible = show ?? open ?? false;
  const handleClose = onClose ?? (() => onOpenChange?.(false));

  const { config } = useAIStore();
  const [input, setInput] = useState('');
  const [generatedCommand, setGeneratedCommand] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // 获取默认 provider
  const defaultProvider = config?.providers.find(
    (p: any) => p.id === config?.defaultProvider && p.enabled
  );

  // 动画效果
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
    }
  }, [isVisible]);

  // 全局键盘事件监听（用于预览阶段的快捷键）
  useEffect(() => {
    if (!isVisible || !showPreview) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handlePanelClose();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isVisible, showPreview]);

  // 重置状态
  const reset = () => {
    setInput('');
    setGeneratedCommand('');
    setShowPreview(false);
    setIsGenerating(false);
  };

  // 关闭时重置
  const handlePanelClose = () => {
    setIsAnimating(false);
    // 等待动画完成后再关闭
    setTimeout(() => {
      reset();
      handleClose();
    }, 150);
  };

  // 生成命令
  const handleGenerate = async () => {
    if (!input.trim()) {
      toast.error('请输入命令描述');
      return;
    }

    if (!defaultProvider) {
      toast.error('请先在设置中配置并启用 AI 服务');
      return;
    }

    setIsGenerating(true);
    playSound(SoundEffect.TOGGLE_SWITCH);

    try {
      const command = await AIClient.generateCommand(defaultProvider, input.trim());
      setGeneratedCommand(command);
      setShowPreview(true);
      playSound(SoundEffect.SUCCESS);
    } catch (error) {
      playSound(SoundEffect.ERROR);
      toast.error(`生成命令失败: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 确认执行命令
  const handleConfirm = () => {
    if (!generatedCommand.trim()) {
      toast.error('没有可执行的命令');
      return;
    }

    onConfirm(generatedCommand);
    handlePanelClose();
  };

  // 重新生成
  const handleRegenerate = () => {
    setShowPreview(false);
    handleGenerate();
  };

  // 快捷键支持
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !showPreview) {
      e.preventDefault();
      handleGenerate();
    } else if (e.key === 'Enter' && showPreview) {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handlePanelClose();
    }
  };

  if (!isVisible && !isAnimating) return null;

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 w-[500px] max-w-[calc(100vw-2rem)] transition-all duration-300 ease-out',
        isAnimating ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
      )}
    >
      <div className="border-2 rounded-xl bg-card overflow-hidden">
        {/* 标题栏 - 带渐变背景 */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg animate-pulse-slow">
              <Wand2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="font-semibold text-base">
                {showPreview ? '命令预览' : 'AI 生成命令'}
              </span>
              {!showPreview && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  输入描述，让 AI 为你生成命令
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
            onClick={handlePanelClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 内容区 */}
        <div className="p-5 space-y-4">
          {!showPreview ? (
            // 输入阶段
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="nl-input" className="text-sm font-medium">
                    描述你想要执行的操作
                  </Label>
                  <div className="h-px flex-1 bg-border"></div>
                </div>
                <div className="relative group">
                  <Input
                    id="nl-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="例如: 查看所有 docker 容器"
                    autoFocus
                    disabled={isGenerating}
                    autoComplete="off"
                    className="text-sm pr-24 h-11 transition-all focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-2 focus-visible:border-emerald-500"
                  />
                  {input && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-muted-foreground animate-in fade-in slide-in-from-right-2 duration-300">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                      {input.length} 字符
                    </div>
                  )}
                </div>
                {input.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground animate-in fade-in slide-in-from-top-2 duration-300">
                    <Terminal className="h-3 w-3" />
                    按 Enter 生成命令
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-xs text-foreground bg-muted/50 px-3 py-2 rounded-lg">
                  <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded text-sm">#</span>
                  <span className="font-semibold">触发此面板</span>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={!input.trim() || isGenerating}
                  size="default"
                  className="gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      生成命令
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            // 预览阶段
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">原始描述</Label>
                  <div className="h-px flex-1 bg-border"></div>
                </div>
                <div className="text-sm text-foreground bg-muted/30 p-3 rounded-lg border animate-in fade-in duration-300">
                  {input}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">生成的命令</Label>
                  <div className="h-px flex-1 bg-border"></div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg border-2 border-primary/20 relative group hover:border-primary/40 transition-all animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Terminal className="h-4 w-4 text-primary/50" />
                  </div>
                  <pre className="text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all">
                    <code className="text-foreground font-semibold">{generatedCommand}</code>
                  </pre>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="gap-2 hover:bg-primary/5 transition-all"
                >
                  <RefreshCw className={cn("h-4 w-4", isGenerating && "animate-spin")} />
                  重新生成
                </Button>
                <Button
                  size="default"
                  onClick={handleConfirm}
                  className="gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <Terminal className="h-4 w-4" />
                  确认执行
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 底部装饰条 */}
        <div className="h-1 bg-gradient-to-r from-blue-500/40 via-purple-500/60 to-pink-500/40"></div>
      </div>
    </div>
  );
}

// 导出别名，保持与文件名一致
export { NLToCommandPanel as NLToCommandDialog };
