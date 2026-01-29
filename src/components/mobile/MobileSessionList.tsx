import { useState } from 'react';
import { Plus, Search, Server, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MobileSessionCard } from './MobileSessionCard';
import { QuickConnectDialog } from '@/components/session/QuickConnectDialog';
import { EditSessionDialog } from '@/components/session/EditSessionDialog';
import type { SessionInfo, SessionConfig } from '@/types/ssh';
import { useSessionStore } from '@/store/sessionStore';
import { playSound } from '@/lib/sounds';
import { SoundEffect } from '@/lib/sounds';
import { toast } from 'sonner';

export function MobileSessionList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuickConnect, setShowQuickConnect] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionInfo | null>(null);
  const { sessions, createTemporaryConnection } = useSessionStore();

  // 过滤会话配置（不包括连接实例）
  const sessionConfigs = sessions.filter(session => !session.connectionSessionId);

  // 根据搜索词过滤会话
  const filteredSessions = sessionConfigs.filter(session =>
    session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.host.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 计算统计信息
  const connectedCount = sessions.filter(
    s => s.connectionSessionId && s.status === 'connected'
  ).length;
  const totalCount = sessionConfigs.length;

  const handleEditSession = async (session: SessionInfo) => {
    playSound(SoundEffect.BUTTON_CLICK);
    setEditingSession(session);
  };

  const handleCloseEdit = () => {
    setEditingSession(null);
  };

  const handleUpdateSession = async (config: Partial<SessionConfig>) => {
    if (!editingSession) return;

    try {
      // 调用更新会话的函数
      const { updateSession } = useSessionStore.getState();
      await updateSession(editingSession.id, config);
      playSound(SoundEffect.SUCCESS);
      toast.success('会话更新成功');
      setEditingSession(null);
    } catch (error) {
      playSound(SoundEffect.ERROR);
      console.error('Failed to update session:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error('会话更新失败', {
        description: errorMessage,
      });
    }
  };

  const handleQuickConnect = async (config: {
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKeyPath?: string;
    passphrase?: string;
  }) => {
    try {
      // 创建临时连接（不保存到存储）
      await createTemporaryConnection({
        name: `${config.username}@${config.host}`,
        host: config.host,
        port: config.port,
        username: config.username,
        authMethod: config.password
          ? { Password: { password: config.password } }
          : { PublicKey: { privateKeyPath: config.privateKeyPath || '', passphrase: config.passphrase } },
      });

      playSound(SoundEffect.SUCCESS);
      toast.success('连接成功');
    } catch (error) {
      playSound(SoundEffect.ERROR);
      console.error('Quick connect failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error('快速连接失败', {
        description: errorMessage,
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 顶部标题栏 */}
      <div className="border-b bg-card p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">SSH 会话</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {totalCount} 个会话
                </span>
              </div>
              <div className="flex items-center gap-1">
                {connectedCount > 0 ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {connectedCount} 个连接中
                </span>
              </div>
            </div>
          </div>
          
          <Button
            size="lg"
            onClick={() => {
              playSound(SoundEffect.BUTTON_CLICK);
              setShowQuickConnect(true);
            }}
            className="h-12 px-4 touch-manipulation"
          >
            <Plus className="h-5 w-5 mr-2" />
            新建
          </Button>
        </div>

        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="搜索会话..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base touch-manipulation"
          />
        </div>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Server className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无会话</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? '没有找到匹配的会话' : '点击右上角按钮创建第一个 SSH 会话'}
            </p>
            {!searchTerm && (
              <Button
                size="lg"
                onClick={() => {
                  playSound(SoundEffect.BUTTON_CLICK);
                  setShowQuickConnect(true);
                }}
                className="h-12 px-6 touch-manipulation"
              >
                <Plus className="h-5 w-5 mr-2" />
                快速连接
              </Button>
            )}
          </div>
        ) : (
          filteredSessions.map((session) => (
            <MobileSessionCard
              key={session.id}
              sessionId={session.id}
              onEdit={handleEditSession}
            />
          ))
        )}
      </div>

      {/* 快速连接对话框 */}
      <QuickConnectDialog
        open={showQuickConnect}
        onOpenChange={setShowQuickConnect}
        onConnect={handleQuickConnect}
      />

      {/* 编辑会话对话框 */}
      {editingSession && (
        <EditSessionDialog
          open={!!editingSession}
          onOpenChange={(open) => !open && handleCloseEdit()}
          session={editingSession}
          onUpdate={handleUpdateSession}
        />
      )}
    </div>
  );
}