import { useEffect, useState } from 'react';
import { Plus, Save, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SessionCard } from '@/components/session/SessionCard';
import { SessionToolbar } from '@/components/session/SessionToolbar';
import { SaveSessionDialog } from '@/components/session/SaveSessionDialog';
import { useSessionStore } from '@/store/sessionStore';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { playSound } from '@/lib/sounds';
import { SoundEffect } from '@/lib/sounds';

export function SessionManager() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessions, loadSessions, loadSessionsFromStorage, saveSessions, createSession, isStorageLoaded } = useSessionStore();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

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

    initializeSessions();
  }, [location.pathname]); // 只依赖路由变化

  const handleNewSession = () => {
    playSound(SoundEffect.BUTTON_CLICK);
    setSaveDialogOpen(true);
  };

  const handleSaveSession = async (config: any) => {
    await createSession(config);
    await loadSessions();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSessions();
      playSound(SoundEffect.SUCCESS);
    } catch (error) {
      playSound(SoundEffect.ERROR);
      console.error('Failed to save sessions:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = (sessionId: string) => {
    playSound(SoundEffect.BUTTON_CLICK);
    navigate('/terminal');
  };

  // 过滤会话
  const getFilteredSessions = () => {
    let filtered = sessions;

    // 搜索过滤
    if (search) {
      filtered = filtered.filter(session =>
        session.name.toLowerCase().includes(search.toLowerCase()) ||
        session.host.toLowerCase().includes(search.toLowerCase()) ||
        session.username.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 状态过滤
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter);
    }

    // 最近连接过滤（最近24小时内连接过的）
    if (activeTab === 'recent') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      filtered = filtered.filter(session => {
        if (!session.connectedAt) return false;
        const connectedDate = new Date(session.connectedAt);
        return connectedDate > oneDayAgo;
      });
    }

    return filtered;
  };

  const filteredSessions = getFilteredSessions();
  const hasRecentSessions = sessions.some(s =>
    s.connectedAt && new Date(s.connectedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">会话管理</h1>
          <p className="text-muted-foreground mt-1">
            管理你的 SSH 会话配置
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/terminal')}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            打开终端
          </Button>
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? '保存中...' : '保存会话'}
          </Button>
          <Button onClick={handleNewSession}>
            <Plus className="h-4 w-4 mr-2" />
            新建会话
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
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-muted/20 rounded-full p-6 mb-4">
                <FolderOpen className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {search || statusFilter !== 'all' ? '没有匹配的会话' : '没有保存的会话'}
              </h2>
              <p className="text-muted-foreground">
                {search || statusFilter !== 'all'
                  ? '尝试调整搜索条件或筛选器'
                  : '创建你的第一个 SSH 会话配置'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                前往 <span className="font-medium">终端</span> 页面创建新连接
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSessions.map((session) => (
                <SessionCard key={session.id} sessionId={session.id} />
              ))}
            </div>
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
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-muted/20 rounded-full p-6 mb-4">
                <FolderOpen className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">没有最近的连接</h2>
              <p className="text-muted-foreground mb-6">
                最近24小时内没有连接记录
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSessions.map((session) => (
                <SessionCard key={session.id} sessionId={session.id} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 保存会话对话框 */}
      <SaveSessionDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveSession}
      />
    </div>
  );
}
