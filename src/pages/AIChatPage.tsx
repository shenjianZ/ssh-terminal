/**
 * AI 对话独立页面
 *
 * 提供类似 ChatGPT 的独立聊天界面
 * 支持按服务器分组的对话历史管理
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAIStore } from '@/store/aiStore';
import { AIChatLayout } from '@/components/ai/chat/AIChatLayout';
import { playSound, SoundEffect } from '@/lib/sounds';

export function AIChatPage() {
  const { conversationId, serverId } = useParams();
  const navigate = useNavigate();
  const {
    loadServerGroups,
    selectConversation,
    selectServer,
    serverGroups
  } = useAIStore();

  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 初始化：加载服务器分组
  useEffect(() => {
    loadServerGroups().then(() => {
      setLoading(false);
    });
  }, [loadServerGroups]);

  // URL 参数处理
  useEffect(() => {
    if (conversationId) {
      selectConversation(conversationId);
    } else if (serverId) {
      selectServer(serverId);
    }
  }, [conversationId, serverId, selectConversation, selectServer]);

  const handleNewChat = () => {
    // TODO: 打开服务器选择对话框
    // 暂时选择第一个服务器
    if (serverGroups.length > 0) {
      const firstServer = serverGroups[0];
      navigate(`/ai-chat?serverId=${firstServer.serverIdentity.sessionId}`);
      selectServer(firstServer.serverIdentity.sessionId);
      playSound(SoundEffect.SUCCESS);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <AIChatLayout
        onNewChat={handleNewChat}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
    </div>
  );
}
