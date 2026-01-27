import { useEffect, useState } from 'react';
import { Terminal as TerminalIcon, Plus, FolderOpen } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TabBar } from '@/components/terminal/TabBar';
import { XTermWrapper } from '@/components/terminal/XTermWrapper';
import { ErrorBoundary } from '@/components/terminal/ErrorBoundary';
import { QuickConnectDialog } from '@/components/session/QuickConnectDialog';
import { ConnectionStatusBadge } from '@/components/ssh/ConnectionStatusBadge';
import { RecordingControls, RecordingManager } from '@/components/recording';
import { useSessionStore } from '@/store/sessionStore';
import { useTerminalStore } from '@/store/terminalStore';
import { useTerminalConfigStore } from '@/store/terminalConfigStore';
import { playSound } from '@/lib/sounds';
import { SoundEffect } from '@/lib/sounds';

export function Terminal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [quickConnectOpen, setQuickConnectOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecordingManager, setShowRecordingManager] = useState(false);
  const { sessions, loadSessions, loadSessionsFromStorage, createTemporaryConnection, connectSession, disconnectSession, isStorageLoaded } = useSessionStore();
  const { tabs, addTab, getActiveTab, focusTerminal } = useTerminalStore();
  const { config: terminalConfig } = useTerminalConfigStore();

  useEffect(() => {
    // 只在终端页面初始化
    if (location.pathname !== '/' && location.pathname !== '/terminal') {
      return;
    }

    const initializeSessions = async () => {
      setIsLoading(true);
      try {
        // 只在首次加载时从存储加载配置
        if (!isStorageLoaded) {
          await loadSessionsFromStorage();
        }
        // 每次切换回终端页面时，重新从后端获取最新状态
        await loadSessions();
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSessions();

    // 监听tab关闭事件，自动断开连接
    const handleTabClosed = async (event: CustomEvent) => {
      const { connectionId } = event.detail;
      // 使用 getState() 获取最新的 sessions，避免将 sessions 加入依赖数组导致无限循环
      const session = useSessionStore.getState().sessions.find(s => s.id === connectionId);
      if (session && session.status === 'connected') {
        try {
          await disconnectSession(connectionId);
          console.log(`Disconnected session: ${session.name}`);
        } catch (error) {
          console.error('Failed to disconnect session:', error);
        }
      }
    };

    // 监听快捷键触发的新建连接事件
    const handleNewConnection = () => {
      setQuickConnectOpen(true);
    };

    // 监听快捷键触发的复制标签页事件
    const handleDuplicateTab = async (event: Event) => {
      const customEvent = event as CustomEvent<{ connectionId: string; sessionId: string }>;
      const { connectionId, sessionId } = customEvent.detail;

      try {
        // 使用 getState() 获取最新的 sessions，避免将 sessions 加入依赖数组导致无限循环
        const session = useSessionStore.getState().sessions.find(s => s.id === sessionId);
        const tabTitle = session?.name || `${sessionId.substring(0, 8)}...`;

        // 连接新创建的连接实例
        await connectSession(connectionId);
        playSound(SoundEffect.SUCCESS);

        // 添加新标签页
        addTab(connectionId, tabTitle);

        console.log(`[Terminal] Created duplicate tab for session: ${sessionId}`);
      } catch (error) {
        playSound(SoundEffect.ERROR);
        console.error('Failed to create duplicate tab:', error);
      }
    };

    // 监听全局的打开快速连接对话框事件（从 App.tsx 触发）
    const handleGlobalOpenQuickConnect = () => {
      setQuickConnectOpen(true);
    };

    // 当从其他页面导航到终端页面时，检查是否需要打开快速连接对话框
    const checkAndOpenQuickConnect = () => {
      if (location.pathname === '/' || location.pathname === '/terminal') {
        // 使用 setTimeout 确保组件已经完全渲染
        setTimeout(() => {
          // 检查 URL 查询参数或全局状态
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('action') === 'new-connection') {
            setQuickConnectOpen(true);
            // 清除 URL 参数
            window.history.replaceState({}, '', window.location.pathname);
          }
        }, 100);
      }
    };

    window.addEventListener('tab-closed-for-session', handleTabClosed as unknown as EventListener);
    window.addEventListener('keybinding-new-connection', handleNewConnection);
    window.addEventListener('keybinding-duplicate-tab', handleDuplicateTab);
    window.addEventListener('keybinding-terminal-find', handleNewConnection); // 查找功能也打开快速连接对话框（临时）
    window.addEventListener('global-open-quick-connect', handleGlobalOpenQuickConnect);

    // 初始检查
    checkAndOpenQuickConnect();

    return () => {
      window.removeEventListener('tab-closed-for-session', handleTabClosed as unknown as EventListener);
      window.removeEventListener('keybinding-new-connection', handleNewConnection);
      window.removeEventListener('keybinding-duplicate-tab', handleDuplicateTab);
      window.removeEventListener('keybinding-terminal-find', handleNewConnection);
      window.removeEventListener('global-open-quick-connect', handleGlobalOpenQuickConnect);
    };
  }, [location.pathname, isStorageLoaded, loadSessions, loadSessionsFromStorage, disconnectSession, connectSession, addTab]);

  // 当切换到终端页面时，聚焦当前活动标签页的终端
  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '/terminal') {
      // 延迟聚焦，确保终端已经渲染完成
      const timer = setTimeout(() => {
        const activeTab = getActiveTab();
        if (activeTab) {
          focusTerminal(activeTab.connectionId);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, getActiveTab, focusTerminal]);

  const handleNewTab = () => {
    playSound(SoundEffect.BUTTON_CLICK);
    setQuickConnectOpen(true);
  };

  const handleSessionManager = () => {
    playSound(SoundEffect.BUTTON_CLICK);
    navigate('/sessions');
  };

  const handleQuickConnect = async (config: {
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKeyPath?: string;
    passphrase?: string;
  }) => {
    // 创建临时会话配置（不保存）
    const sessionConfig: any = {
      name: `${config.username}@${config.host}`, // 临时名称
      host: config.host,
      port: config.port,
      username: config.username,
      auth_method: config.password ? { Password: { password: config.password } } : { PublicKey: { private_key_path: config.privateKeyPath || '', passphrase: config.passphrase } },
      password: config.password,
      privateKeyPath: config.privateKeyPath,
      passphrase: config.passphrase,
      keepAliveInterval: terminalConfig.keepAliveInterval, // 使用设置的心跳间隔
    };

    try {
      // 直接创建临时连接并返回 connectionId
      const connectionId = await createTemporaryConnection(sessionConfig);
      playSound(SoundEffect.TAB_OPEN);

      // 对于临时连接，connectionId 就是连接实例ID，直接连接它
      // connectSession 会接收 connectionId，后端会识别并直接连接
      await connectSession(connectionId);
      playSound(SoundEffect.SUCCESS);

      // 使用 connectionId 添加标签页
      addTab(connectionId, sessionConfig.name);
    } catch (error) {
      playSound(SoundEffect.ERROR);
      console.error('Failed to connect:', error);
    }
  };

  const activeTab = getActiveTab();
  const activeSession = activeTab
    ? sessions.find((s) => s.id === activeTab.connectionId)
    : null;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 标签页栏 */}
      <TabBar />

      {/* 工具栏 */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/40 border-b border-border">
        <Button size="sm" variant="outline" onClick={handleNewTab} className="gap-1.5">
          <Plus className="h-4 w-4" />
          新建连接
        </Button>

        <Separator orientation="vertical" className="h-5" />

        <Button size="sm" variant="ghost" onClick={handleSessionManager} className="gap-1.5">
          <FolderOpen className="h-4 w-4" />
          会话管理
        </Button>

        <Separator orientation="vertical" className="h-5" />

        {/* 录制控制 */}
        {activeTab && (
          <RecordingControls
            connectionId={activeTab.connectionId}
            sessionName={activeSession?.name}
          />
        )}

        {/* 录制管理器按钮 - 始终显示 */}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowRecordingManager(true)}
          className="gap-1.5"
        >
          <FolderOpen className="h-4 w-4" />
          录制管理
        </Button>

        <div className="flex-1" />

        {/* 显示当前连接信息 */}
        {activeSession && (
          <div className="flex items-center gap-3 text-sm">
            <ConnectionStatusBadge status={activeSession.status} />
            <span className="font-medium">{activeSession.name}</span>
            <span className="text-muted-foreground font-mono text-xs">
              ({activeSession.username}@{activeSession.host}:{activeSession.port})
            </span>
          </div>
        )}
      </div>

      {/* 终端内容区域 */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          // 加载状态
          <div className="flex flex-col items-center justify-center h-full bg-muted/10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-muted-foreground">正在加载会话...</p>
          </div>
        ) : tabs.length === 0 ? (
          // 空状态
          <div className="flex flex-col items-center justify-center h-full bg-muted/10">
            <div className="flex flex-col items-center text-center max-w-md px-6">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <TerminalIcon className="h-10 w-10 text-primary/60" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-foreground">没有活动的 SSH 会话</h2>
              <p className="text-sm text-muted-foreground mb-6">
                点击下方按钮创建新的 SSH 连接，或从侧边栏选择其他功能
              </p>
              <Button onClick={handleNewTab} size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                新建连接
              </Button>
            </div>
          </div>
        ) : activeTab && activeSession ? (
          // 只渲染活动标签页（但所有连接的监听器都在 store 中保持活跃）
          <ErrorBoundary key={activeTab.connectionId}>
            <XTermWrapper connectionId={activeTab.connectionId} />
          </ErrorBoundary>
        ) : (
          // 没有活动标签页
          <div className="flex items-center justify-center h-full bg-muted/10">
            <div className="text-center">
              <p className="text-muted-foreground">选择或创建一个标签页开始使用</p>
            </div>
          </div>
        )}
      </div>

      {/* 快速连接对话框 */}
      <QuickConnectDialog
        open={quickConnectOpen}
        onOpenChange={setQuickConnectOpen}
        onConnect={handleQuickConnect}
      />

      {/* 录制文件管理器 */}
      {showRecordingManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <div className="w-full h-full max-w-7xl max-h-[90vh] my-auto">
            <RecordingManager onClose={() => setShowRecordingManager(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
