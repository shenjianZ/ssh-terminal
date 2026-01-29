/**
 * AI 聊天侧边栏组件
 *
 * 显示服务器列表和搜索功能
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus } from 'lucide-react';
import { useAIStore } from '@/store/aiStore';
import { ServerList } from './ServerList';

export function AIChatSidebar({ onNewChat }: { onNewChat: () => void }) {
  const { serverGroups } = useAIStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroups = serverGroups.filter(group =>
    group.serverIdentity.sessionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.serverIdentity.host.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full">
      {/* 工具栏 */}
      <div className="p-4 border-b border-border space-y-3">
        <Button onClick={onNewChat} className="w-full" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          新建对话
        </Button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索服务器..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* 服务器列表 */}
      <ScrollArea className="flex-1">
        <ServerList groups={filteredGroups} />
      </ScrollArea>
    </div>
  );
}
