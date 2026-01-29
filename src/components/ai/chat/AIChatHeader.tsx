/**
 * AI 聊天顶部栏组件
 *
 * 显示当前对话的服务器信息和状态
 */

import { Server, Activity } from 'lucide-react';
import { useAIStore } from '@/store/aiStore';
import { Badge } from '@/components/ui/badge';

interface AIChatHeaderProps {
  serverId: string;
}

export function AIChatHeader({ serverId }: AIChatHeaderProps) {
  const { serverGroups, isServerOnline } = useAIStore();

  // 查找当前服务器的信息
  const currentGroup = serverGroups.find(
    (g) => g.serverIdentity.sessionId === serverId
  );

  if (!currentGroup) {
    return null;
  }

  const { serverIdentity } = currentGroup;
  const isOnline = isServerOnline(serverId);

  return (
    <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-background">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
          <Server className="w-4 h-4 text-primary" />
        </div>

        <div>
          <h3 className="font-semibold text-sm">{serverIdentity.sessionName}</h3>
          <p className="text-xs text-muted-foreground">
            {serverIdentity.username}@{serverIdentity.host}:{serverIdentity.port}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isOnline ? (
          <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-400">
            <Activity className="w-3 h-3 mr-1" />
            在线
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            离线
          </Badge>
        )}
      </div>
    </div>
  );
}
