import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { normalizeKeyCombo, serializeKeyBinding } from '@/lib/keybindingParser';
import type { KeyCombination } from '@/types/keybinding';
import { Keyboard } from 'lucide-react';

interface KeybindingRecorderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecord: (keys: KeyCombination) => void;
  currentKeys?: KeyCombination;
  title?: string;
  description?: string;
}

/**
 * 快捷键录制组件
 * 允许用户按下键盘组合来录制快捷键
 */
export function KeybindingRecorder({
  open,
  onOpenChange,
  onRecord,
  currentKeys,
  title = '录制快捷键',
  description = '请按下您想要设置的快捷键组合',
}: KeybindingRecorderProps) {
  const [recordedKeys, setRecordedKeys] = useState<KeyCombination | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef(false);

  useEffect(() => {
    if (open) {
      // 对话框打开时，开始录制
      setIsRecording(true);
      recordingRef.current = true;
      setRecordedKeys(null);

      // 延迟添加监听器，避免触发打开对话框的按键
      const timer = setTimeout(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
      }, 100);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        recordingRef.current = false;
      };
    }
  }, [open]);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!recordingRef.current) return;

    // 阻止默认行为
    event.preventDefault();
    event.stopPropagation();

    // 忽略修饰键单独按下
    if (
      ['Control', 'Alt', 'Shift', 'Meta'].includes(event.key) ||
      ['ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'ShiftLeft', 'ShiftRight', 'MetaLeft', 'MetaRight'].includes(
        event.code
      )
    ) {
      return;
    }

    // 标准化快捷键组合
    const keys = normalizeKeyCombo(event);
    setRecordedKeys(keys);
    setIsRecording(false);
    recordingRef.current = false;

    // 移除监听器
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
  };

  const handleKeyUp = () => {
    // 键盘抬起时，如果已经录制了快捷键，可以选择自动关闭
    // 但这里我们让用户手动确认
  };

  const handleClear = () => {
    setRecordedKeys(null);
    setIsRecording(true);
    recordingRef.current = true;

    // 重新添加监听器
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
  };

  const handleConfirm = () => {
    if (recordedKeys) {
      onRecord(recordedKeys);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {isRecording ? (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                <Keyboard className="relative h-16 w-16 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                请按下快捷键组合...
              </p>
              <p className="text-xs text-muted-foreground">
                支持 Ctrl、Alt、Shift 和字母/数字/功能键的组合
              </p>
            </div>
          ) : recordedKeys ? (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="rounded-lg border-2 border-primary bg-primary/10 px-6 py-4">
                <p className="text-2xl font-bold text-primary">
                  {serializeKeyBinding(recordedKeys)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                已录制的快捷键
              </p>
            </div>
          ) : currentKeys ? (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="rounded-lg border-2 border-muted bg-muted/30 px-6 py-4">
                <p className="text-2xl font-bold text-muted-foreground">
                  {serializeKeyBinding(currentKeys)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                当前快捷键
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          {recordedKeys && (
            <Button variant="outline" onClick={handleClear}>
              重新录制
            </Button>
          )}
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={!recordedKeys}>
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
