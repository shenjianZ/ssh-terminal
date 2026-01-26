import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Terminal } from "@/pages/Terminal";
import { SessionManager } from "@/pages/SessionManager";
import { Settings } from "@/pages/Settings";
import { SftpManager } from "@/pages/SftpManager";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { useTerminalConfigStore } from "@/store/terminalConfigStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { MobileSessionList } from "@/components/mobile/MobileSessionList";
import { MobileTerminalPage } from "@/components/mobile/MobileTerminalPage";
import { isMobileDevice, isAndroid, isIOS } from "@/lib/utils";
import { globalKeyHandler } from "@/lib/globalKeyHandler";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const loadConfig = useTerminalConfigStore(state => state.loadConfig);
  const toggleSidebar = useSidebarStore(state => state.toggleSidebar);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // 更新全局快捷键处理器的当前路径
  useEffect(() => {
    globalKeyHandler.setCurrentPath(location.pathname);
  }, [location.pathname]);

  // 监听快捷键触发的全局事件
  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const customEvent = event as CustomEvent<{ path: string }>;
      if (customEvent.detail?.path) {
        navigate(customEvent.detail.path);
      }
    };

    const handleToggleSidebar = () => {
      toggleSidebar();
    };

    const handleNewConnection = () => {
      // 如果在终端页面，直接触发打开快速连接对话框事件
      if (location.pathname === '/' || location.pathname === '/terminal') {
        window.dispatchEvent(new CustomEvent('global-open-quick-connect'));
      } else {
        // 如果不在终端页面，先导航到终端页面
        navigate('/terminal');
        // 导航完成后触发打开对话框事件
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('global-open-quick-connect'));
        }, 100);
      }
    };

    window.addEventListener('keybinding-navigate', handleNavigate);
    window.addEventListener('keybinding-toggle-sidebar', handleToggleSidebar);
    window.addEventListener('keybinding-new-connection', handleNewConnection);

    return () => {
      window.removeEventListener('keybinding-navigate', handleNavigate);
      window.removeEventListener('keybinding-toggle-sidebar', handleToggleSidebar);
      window.removeEventListener('keybinding-new-connection', handleNewConnection);
    };
  }, [navigate, toggleSidebar, location.pathname]);

  // 检测设备类型
  const isMobile = isMobileDevice();
  const isAndroidDevice = isAndroid();
  const isIOSDevice = isIOS();

  // 根据设备类型设置body类
  useEffect(() => {
    if (isMobile) {
      document.body.classList.add('mobile');
      if (isAndroidDevice) {
        document.body.classList.add('android');
      } else if (isIOSDevice) {
        document.body.classList.add('ios');
      }
    } else {
      document.body.classList.remove('mobile', 'android', 'ios');
    }
  }, [isMobile, isAndroidDevice, isIOSDevice]);

  if (isMobile) {
    return (
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <MobileLayout>
          <Routes>
            <Route path="/" element={<MobileSessionList />} />
            <Route path="/terminal" element={<MobileTerminalPage />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </MobileLayout>
        <Toaster position="top-center" />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <MainLayout>
        <Routes>
          <Route path="/" element={<Terminal />} />
          <Route path="/terminal" element={<Terminal />} />
          <Route path="/sessions" element={<SessionManager />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/sftp" element={<SftpManager />} />
        </Routes>
      </MainLayout>
      <Toaster position="top-center" />
    </ThemeProvider>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
