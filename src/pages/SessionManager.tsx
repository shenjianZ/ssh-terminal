import { useEffect, useState } from 'react';
import { Plus, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SessionCard } from '@/components/session/SessionCard';
import { SessionToolbar } from '@/components/session/SessionToolbar';
import { SaveSessionDialog } from '@/components/session/SaveSessionDialog';
import { EditSessionDialog } from '@/components/session/EditSessionDialog';
import { useSessionStore } from '@/store/sessionStore';
import { useTerminalConfigStore } from '@/store/terminalConfigStore';
import type { SessionInfo, SessionConfig } from '@/types/ssh';
import { useNavigate, useLocation } from 'react-router-dom';
import { playSound } from '@/lib/sounds';
import { SoundEffect } from '@/lib/sounds';

// 常量定义
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function SessionManager() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessions, loadSessions, loadSessionsFromStorage, createSession, isStorageLoaded } = useSessionStore();
  const { config: terminalConfig } = useTerminalConfigStore();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionInfo | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

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

  // 监听快捷键触发的新建会话事件
  useEffect(() => {
    const handleNewSessionShortcut = () => {
      // 只在会话管理页面生效
      if (location.pathname === '/sessions') {
        handleNewSession();
      }
    };

    window.addEventListener('keybinding-new-session', handleNewSessionShortcut);

    return () => {
      window.removeEventListener('keybinding-new-session', handleNewSessionShortcut);
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
    setEditingSession(session);
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

    // 状态过滤 - 修复：基于是否有活跃连接实例来判断
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

    // 最近连接过滤（最近24小时内连接过的）
    if (activeTab === 'recent') {
      const oneDayAgo = new Date(Date.now() - ONE_DAY_MS);
      filtered = filtered.filter(session => {
        if (!session.connectedAt) return false;
        const connectedDate = new Date(session.connectedAt);
        return connectedDate > oneDayAgo;
      });
    }

    return filtered;
  };

  const filteredSessions = getFilteredSessions();
  const hasRecentSessions = sessionConfigs.some(s =>
    s.connectedAt && new Date(s.connectedAt) > new Date(Date.now() - ONE_DAY_MS)
  );

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
      {/* 页面标题和操作栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">会话管理</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            管理你的 SSH 会话配置
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/terminal')}
            className="touch-manipulation"
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">打开终端</span>
            <span className="sm:hidden">终端</span>
          </Button>
          <Button onClick={handleNewSession} className="touch-manipulation">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">新建会话</span>
            <span className="sm:hidden">新建</span>
          </Button>
        </div>
      </div>

      {/* 标签页和工具栏 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">全部会话</TabsTrigger>
          <TabsTrigger value="recent" disabled={!hasRecentSessions}>
            最近连接
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <SessionToolbar
            search={search}
            onSearchChange={setSearch}
            filter={statusFilter}
            onFilterChange={setStatusFilter}
          />

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
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <SessionToolbar
            search={search}
            onSearchChange={setSearch}
            filter={statusFilter}
            onFilterChange={setStatusFilter}
          />

          {filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center px-4">
              <div className="bg-muted/20 rounded-full p-4 sm:p-6 mb-4">
                <FolderOpen className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2">没有最近的连接</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                最近24小时内没有连接记录
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {filteredSessions.map((session) => (
                                <SessionCard 
                                  key={session.id} 
                                  sessionId={session.id}
                                  onEdit={handleEditSession}
                                />
                              ))}
                            </div>          )}
        </TabsContent>
      </Tabs>

      {/* 保存会话对话框 */}
      <SaveSessionDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveSession}
      />

      {editingSession && (
        <EditSessionDialog
          open={!!editingSession}
          onOpenChange={(open) => !open && setEditingSession(null)}
          session={editingSession}
          onUpdate={handleUpdateSession}
        />
      )}
    </div>
  );
}
