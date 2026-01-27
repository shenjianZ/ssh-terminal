import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RecordingIndicator } from '@/components/recording';
import { useTerminalStore } from '@/store/terminalStore';
import { useRecordingStore } from '@/store/recordingStore';
import { playSound } from '@/lib/sounds';
import { SoundEffect } from '@/lib/sounds';

export function TabBar() {
  const { tabs, setActiveTab, removeTab, focusTerminal } = useTerminalStore();

  if (tabs.length === 0) {
    return null;
  }

  return (
    <>
      {/* 标签页栏 */}
      <div className="flex items-center gap-1 bg-muted/30 border-b border-border px-2 py-1">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`
              group flex items-center gap-2 px-3 py-1.5 rounded-t-lg
              border-b-2 transition-all cursor-pointer select-none
              min-w-[120px] max-w-[200px]
              ${
                tab.isActive
                  ? 'bg-background border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:bg-muted/40'
              }
            `}
            onClick={() => {
              if (!tab.isActive) {
                playSound(SoundEffect.TAB_SWITCH);
                // 切换到新标签页时，聚焦对应的终端
                setActiveTab(tab.id);
                // 延迟聚焦，确保终端组件已经完成渲染和 DOM 更新
                setTimeout(() => {
                  focusTerminal(tab.connectionId);
                }, 150);
              }
            }}
          >
            <span className="text-sm font-medium truncate flex-1">
              {tab.title}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                playSound(SoundEffect.TAB_CLOSE);
                removeTab(tab.id);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* 录制指示器栏（显示在活动标签页下方） */}
      {tabs.some((tab) => {
        const session = useRecordingStore.getState().getRecordingSession(tab.connectionId);
        return session && session.status !== 'stopped';
      }) && (
        <div className="flex items-center bg-background border-b border-border">
          {tabs.map((tab) => {
            // 只为正在录制的标签页显示指示器
            const recordingSession = useRecordingStore.getState().getRecordingSession(tab.connectionId);
            if (!recordingSession || recordingSession.status === 'stopped') {
              return null;
            }
            return (
              <div
                key={`recording-${tab.id}`}
                className="flex-1 flex justify-center"
              >
                <RecordingIndicator connectionId={tab.connectionId} />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
