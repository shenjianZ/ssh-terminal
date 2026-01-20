import { useState } from 'react';
import { Terminal, Trash2, Edit, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ConnectionStatusBadge } from '@/components/ssh/ConnectionStatusBadge';
import type { SessionInfo } from '@/types/ssh';
import { useSessionStore } from '@/store/sessionStore';
import { useTerminalStore } from '@/store/terminalStore';
import { useNavigate } from 'react-router-dom';
import { playSound } from '@/lib/sounds';
import { SoundEffect } from '@/lib/sounds';

interface SessionCardProps {
  sessionId: string;
}

export function SessionCard({ sessionId }: SessionCardProps) {
  const [connecting, setConnecting] = useState(false);
  const navigate = useNavigate();
  const { connectSession, disconnectSession, deleteSession, setActiveSession, sessions } = useSessionStore();
  const { addTab } = useTerminalStore();

  // 从 store 中动态获取会话信息
  const session = sessions.find(s => s.id === sessionId);

  if (!session) {
    return null;
  }

  const handleConnect = async () => {
    if (session.status === 'connected') {
      // 已连接，添加标签页并跳转到终端
      const tabId = `tab-${session.id}`;
      playSound(SoundEffect.TAB_OPEN);
      addTab(session.id, session.name || `${session.username}@${session.host}`);
      setActiveSession(session.id);
      navigate('/terminal');
    } else {
      // 未连接，先连接
      setConnecting(true);
      try {
        await connectSession(session.id);
        playSound(SoundEffect.SUCCESS);
        // 连接成功后添加标签页并跳转
        const tabId = `tab-${session.id}`;
        playSound(SoundEffect.TAB_OPEN);
        addTab(session.id, session.name || `${session.username}@${session.host}`);
        setActiveSession(session.id);
        navigate('/terminal');
      } catch (error) {
        playSound(SoundEffect.ERROR);
        console.error('Failed to connect:', error);
      } finally {
        setConnecting(false);
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectSession(session.id);
      playSound(SoundEffect.SUCCESS);
    } catch (error) {
      playSound(SoundEffect.ERROR);
      console.error('Failed to disconnect:', error);
    }
  };

  const handleDelete = async () => {
    if (confirm(`确定要删除会话 "${session.name}" 吗？`)) {
      try {
        console.log(`正在删除会话: ${session.name} (${session.id})`);
        await deleteSession(session.id);
        playSound(SoundEffect.SUCCESS);
        console.log(`会话删除成功: ${session.name}`);
      } catch (error) {
        playSound(SoundEffect.ERROR);
        console.error('删除会话失败:', error);
        alert(`删除失败: ${error}`);
      }
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            <Terminal className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">{session.name}</CardTitle>
          </div>
          <ConnectionStatusBadge status={session.status} />
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          <div>{session.username}@{session.host}:{session.port}</div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {session.error && (
          <div className="text-sm text-destructive mt-2">
            {session.error}
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2 pt-3">
        {session.status === 'connected' ? (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDisconnect}
              className="flex-1"
            >
              断开
            </Button>
            <Button
              size="sm"
              onClick={handleConnect}
              className="flex-1"
            >
              <Terminal className="h-4 w-4 mr-1" />
              打开终端
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={connecting}
            className="flex-1"
          >
            {connecting ? (
              <>连接中...</>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                连接
              </>
            )}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
