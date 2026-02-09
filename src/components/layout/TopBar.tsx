import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Bell, Plus, FolderOpen, RotateCcw } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import type { TerminalConfig } from "@/types/terminal";
import { useTerminalConfigStore } from "@/store/terminalConfigStore";
import { playSound } from "@/lib/sounds";
import { SoundEffect } from "@/lib/sounds";

const getPageTitle = (pathname: string): string => {
  const titles: Record<string, string> = {
    '/': '终端',
    '/terminal': '终端',
    '/sessions': '会话管理',
    '/settings': '设置',
    '/sftp': '文件管理器',
  };
  return titles[pathname] || 'SSH Terminal';
};

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = getPageTitle(location.pathname);
  const isSessionPage = location.pathname === '/sessions';
  const isSettingsPage = location.pathname === '/settings';
  const { setConfig } = useTerminalConfigStore();

  const handleNewSession = () => {
    window.dispatchEvent(new CustomEvent('topbar-new-session'));
  };

  const handleResetAll = async () => {
    playSound(SoundEffect.BUTTON_CLICK);
    try {
      const defaultConfig = await invoke<TerminalConfig>('storage_config_get_default');
      await setConfig(defaultConfig);
      playSound(SoundEffect.SUCCESS);
    } catch (error) {
      console.error('Failed to reset config:', error);
      playSound(SoundEffect.ERROR);
    }
  };

  return (
    <header className="h-16 bg-background border-b border-border px-6 flex items-center justify-between">
      {/* Page Title */}
      <h1 className="text-xl font-semibold">{pageTitle}</h1>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* 会话管理页面专属按钮 */}
        {isSessionPage && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/terminal')}
              className="touch-manipulation"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">打开终端</span>
              <span className="sm:hidden">终端</span>
            </Button>
            <Button
              size="sm"
              onClick={handleNewSession}
              className="touch-manipulation"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">新建会话</span>
              <span className="sm:hidden">新建</span>
            </Button>
            <div className="w-px h-6 bg-border mx-2" />
          </>
        )}

        {/* 设置页面专属按钮 */}
        {isSettingsPage && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetAll}
              className="gap-2 touch-manipulation"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">重置所有</span>
              <span className="sm:hidden">重置</span>
            </Button>
            <div className="w-px h-6 bg-border mx-2" />
          </>
        )}

        <Button size="sm" variant="ghost">
          <Bell className="h-4 w-4" />
        </Button>
        <ModeToggle />
      </div>
    </header>
  );
}
