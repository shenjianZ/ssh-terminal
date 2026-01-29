/**
 * 服务器列表组件
 *
 * 显示按服务器分组的历史对话列表
 */

import { ServerConversationGroup } from '@/types/ai';
import { ServerGroupItem } from './ServerGroupItem';
import { Server } from 'lucide-react';

interface ServerListProps {
  groups: ServerConversationGroup[];
}

export function ServerList({ groups }: ServerListProps) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm px-4">
        <Server className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>暂无历史对话</p>
        <p className="text-xs mt-1">点击上方按钮创建新对话</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-2">
      {groups.map((group) => (
        <ServerGroupItem
          key={group.serverIdentity.sessionId}
          group={group}
        />
      ))}
    </div>
  );
}
