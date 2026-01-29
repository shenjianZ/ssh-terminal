/**
 * 对话项组件
 *
 * 显示单个对话历史记录
 */

import { useNavigate } from 'react-router-dom';
import { AIConversationMeta } from '@/types/ai';
import { MessageSquare, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAIStore } from '@/store/aiStore';

interface ConversationItemProps {
  conversation: AIConversationMeta;
}

export function ConversationItem({ conversation }: ConversationItemProps) {
  const navigate = useNavigate();
  const { selectConversation } = useAIStore();

  const handleClick = () => {
    selectConversation(conversation.id);
    navigate(`/ai-chat/${conversation.id}`);
  };

  const formatDate = () => {
    try {
      return formatDistanceToNow(new Date(conversation.updatedAt), {
        addSuffix: true,
        locale: zhCN,
      });
    } catch {
      return conversation.updatedAt;
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0"
    >
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded bg-primary/5 flex items-center justify-center flex-shrink-0 mt-0.5">
          <MessageSquare className="w-3 h-3 text-primary/60" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium truncate">{conversation.title}</h4>
            {conversation.connectionStatus === 'active' && (
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500" />
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{formatDate()}</span>
            <span>•</span>
            <span>{conversation.messageCount} 条消息</span>
          </div>
        </div>
      </div>
    </button>
  );
}
