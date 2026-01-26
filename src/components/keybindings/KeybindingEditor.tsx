import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KeybindingRecorder } from './KeybindingRecorder';
import { serializeKeyBinding } from '@/lib/keybindingParser';
import { useKeybindingStore } from '@/store/keybindingStore';
import { Keyboard, RotateCcw } from 'lucide-react';
import type { KeyCombination } from '@/types/keybinding';
import { KEYBINDING_ACTIONS } from '@/types/keybinding';

interface KeybindingEditorProps {
  actionId: string;
}

/**
 * 快捷键编辑器
 * 显示当前快捷键，允许用户点击录制新的快捷键
 */
export function KeybindingEditor({ actionId }: KeybindingEditorProps) {
  const [isRecording, setIsRecording] = useState(false);

  const currentKeys = useKeybindingStore((state) =>
    state.getKeysByAction(actionId)
  );
  const registerKeybinding = useKeybindingStore((state) => state.registerKeybinding);

  const action = KEYBINDING_ACTIONS.find((a) => a.id === actionId);

  const handleRecord = async (keys: KeyCombination) => {
    const success = await registerKeybinding(actionId, keys);
    if (!success) {
      // 用户取消了（因为有冲突）
      console.log('快捷键注册已取消');
    }
  };

  const handleReset = async () => {
    if (!action) return;

    // 如果没有默认快捷键，不执行重置
    if (!action.defaultKeybinding) {
      console.log('该动作没有默认快捷键');
      return;
    }

    const success = await registerKeybinding(
      actionId,
      action.defaultKeybinding,
      false
    );
    if (!success) {
      console.log('快捷键重置已取消');
    }
  };

  if (!action) {
    return <div className="text-sm text-muted-foreground">未知的动作</div>;
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <div className="flex-1">
        <div className="font-medium">{action.name}</div>
        <div className="text-sm text-muted-foreground">{action.description}</div>
      </div>

      <div className="flex items-center gap-2">
        {currentKeys ? (
          <Badge variant="secondary" className="px-3 py-1 text-sm">
            <Keyboard className="mr-1 h-3 w-3" />
            {serializeKeyBinding(currentKeys)}
          </Badge>
        ) : (
          <Badge variant="outline" className="px-3 py-1 text-muted-foreground">
            未设置
          </Badge>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsRecording(true)}
          className="h-8"
        >
          {currentKeys ? '修改' : '设置'}
        </Button>

        {currentKeys && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8"
            title="重置为默认快捷键"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>

      <KeybindingRecorder
        open={isRecording}
        onOpenChange={setIsRecording}
        onRecord={handleRecord}
        currentKeys={currentKeys}
        title={`设置 ${action.name} 快捷键`}
        description={action.description}
      />
    </div>
  );
}
