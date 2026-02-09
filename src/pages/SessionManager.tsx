import { useEffect, useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { SessionCard } from '@/components/session/SessionCard';
import { SessionToolbar } from '@/components/session/SessionToolbar';
import { SaveSessionDialog } from '@/components/session/SaveSessionDialog';
import { EditSessionDialog } from '@/components/session/EditSessionDialog';
import { useSessionStore } from '@/store/sessionStore';
import { useTerminalConfigStore } from '@/store/terminalConfigStore';
import type { SessionInfo, SessionConfig } from '@/types/ssh';
import { useLocation } from 'react-router-dom';
import { playSound } from '@/lib/sounds';
import { SoundEffect } from '@/lib/sounds';

export function SessionManager() {
  const location = useLocation();
  const { sessions, loadSessions, loadSessionsFromStorage, createSession, isStorageLoaded, getSessionConfig } = useSessionStore();
  const { config: terminalConfig } = useTerminalConfigStore();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionInfo | null>(null);
  const [editingSessionConfig, setEditingSessionConfig] = useState<SessionConfig | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // 只显示session配置（过滤掉连接实例）
  const sessionConfigs = sessions.filter(s => !s.connectionSessionId);

  useEffect(() => {
    const initializeSessions = async () => {
      // 只在首次加载时从存储加载配置
      if (!isStorageLoaded) {
        await loadSessionsFromStorage();
      } else {
        // 如果已经从存储加载过，只从后端获取最新状态
        await loadSessions();
      }
    };

    // 只在 /sessions 路由时初始化
    if (location.pathname === '/sessions') {
      initializeSessions();
    }
  }, [location.pathname, isStorageLoaded, loadSessions, loadSessionsFromStorage]);

  // 监听快捷键和 TopBar 触发的新建会话事件
  useEffect(() => {
    const handleNewSessionEvent = () => {
      // 只在会话管理页面生效
      if (location.pathname === '/sessions') {
        handleNewSession();
      }
    };

    window.addEventListener('keybinding-new-session', handleNewSessionEvent);
    window.addEventListener('topbar-new-session', handleNewSessionEvent);

    return () => {
      window.removeEventListener('keybinding-new-session', handleNewSessionEvent);
      window.removeEventListener('topbar-new-session', handleNewSessionEvent);
    };
  }, [location.pathname]);

  const handleNewSession = () => {
    playSound(SoundEffect.BUTTON_CLICK);
    setSaveDialogOpen(true);
  };

  const handleSaveSession = async (config: SessionConfig) => {
    await createSession({
      ...config,
      keepAliveInterval: terminalConfig.keepAliveInterval,
    });
    await loadSessions();
  };

  const handleEditSession = (session: SessionInfo) => {
    const config = getSessionConfig(session.id);
    setEditingSession(session);
    setEditingSessionConfig(config || null);
  };

  const handleUpdateSession = async (config: Partial<SessionConfig>) => {
    if (!editingSession) return;
    const { updateSession } = useSessionStore.getState();
    await updateSession(editingSession.id, config);
    setEditingSession(null);
  };

  // 过滤会话
  const getFilteredSessions = () => {
    let filtered = sessionConfigs;

    // 搜索过滤
    if (search) {
      filtered = filtered.filter(session =>
        session.name.toLowerCase().includes(search.toLowerCase()) ||
        session.host.toLowerCase().includes(search.toLowerCase()) ||
        session.username.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 状态过滤 - 基于是否有活跃连接实例来判断
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => {
        // 查找该会话配置是否有活跃的连接实例
        const hasActiveConnection = sessions.some(
          s => s.connectionSessionId === session.id && s.status === 'connected'
        );

        if (statusFilter === 'connected') {
          return hasActiveConnection;
        } else if (statusFilter === 'disconnected') {
          return !hasActiveConnection;
        }
        return true;
      });
    }

    return filtered;
  };

  const filteredSessions = getFilteredSessions();

  // 按分组分组会话
  const getSessionsByGroup = () => {
    const grouped: Record<string, typeof filteredSessions> = {};

    filteredSessions.forEach(session => {
      const group = session.group || '默认分组';
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(session);
    });

    return grouped;
  };

  const sessionsByGroup = getSessionsByGroup();
  const groups = Object.keys(sessionsByGroup);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* 工具栏 */}
      <SessionToolbar
        search={search}
        onSearchChange={setSearch}
        filter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      {/* 会话列表 */}
      <div className="mt-6">
        {filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center px-4">
          <div className="bg-muted/20 rounded-full p-4 sm:p-6 mb-4">
            <FolderOpen className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold mb-2">
            {search || statusFilter !== 'all' ? '没有匹配的会话' : '没有保存的会话'}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {search || statusFilter !== 'all'
              ? '尝试调整搜索条件或筛选器'
              : '创建你的第一个 SSH 会话配置'}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            前往 <span className="font-medium">终端</span> 页面创建新连接
          </p>
        </div>
      ) : (
        // 按分组显示会话
        groups.map(group => (
          <div key={group} className="space-y-3">
            <h3 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full"></span>
              {group}
              <span className="text-sm font-normal text-muted-foreground">
                ({sessionsByGroup[group].length})
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessionsByGroup[group].map((session) => (
                <SessionCard
                  key={session.id}
                  sessionId={session.id}
                  onEdit={handleEditSession}
                />
              ))}
            </div>
          </div>
        ))
      )}
      </div>

      {/* 保存会话对话框 */}
      <SaveSessionDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveSession}
      />

      {editingSession && (
        <EditSessionDialog
          open={!!editingSession}
          onOpenChange={(open) => {
            if (!open) {
              setEditingSession(null);
              setEditingSessionConfig(null);
            }
          }}
          session={editingSession}
          sessionConfig={editingSessionConfig}
          onUpdate={handleUpdateSession}
        />
      )}
    </div>
  );
}
