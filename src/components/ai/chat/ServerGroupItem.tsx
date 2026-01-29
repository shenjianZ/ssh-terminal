/**
 * 服务器分组项组件
 *
 * 显示单个服务器及其对话列表
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ServerConversationGroup } from '@/types/ai';
import { ChevronDown, ChevronRight, Server, Activity, MessageSquare } from 'lucide-react';
import { ConversationItem } from './ConversationItem';
import { useAIStore } from '@/store/aiStore';

interface ServerGroupItemProps {
  group: ServerConversationGroup;
}

export function ServerGroupItem({ group }: ServerGroupItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const { selectServer, getServerActiveConnectionCount } = useAIStore();

  // 获取实时的活跃连接数
  const activeConnectionCount = getServerActiveConnectionCount(group.serverIdentity.sessionId);

  const handleSelectServer = () => {
    selectServer(group.serverIdentity.sessionId);
    navigate(`/ai-chat?serverId=${group.serverIdentity.sessionId}`);
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      {/* 服务器头部 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-3 py-3 hover:bg-muted/50 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}

        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
          <Server className="w-4 h-4 text-primary" />
        </div>

        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{group.serverIdentity.sessionName}</span>
            {activeConnectionCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <Activity className="w-3 h-3" />
                <span>{activeConnectionCount} 在线</span>
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {group.serverIdentity.username}@{group.serverIdentity.host}:{group.serverIdentity.port}
            {' '}• {group.totalConversations} 个对话
          </div>
        </div>

        {/* 快速开始新对话按钮 */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleSelectServer();
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MessageSquare className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer" />
        </div>
      </button>

      {/* 该服务器的对话列表 */}
      {isExpanded && group.conversations.length > 0 && (
        <div className="border-t bg-muted/20 max-h-64 overflow-y-auto">
          {group.conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
            />
          ))}
        </div>
      )}
    </div>
  );
}
