import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Palette,
  Terminal,
  Bell,
  Keyboard,
  Info,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModeToggle } from '@/components/mode-toggle';
import { TerminalSettings } from '@/components/settings/TerminalSettings';
import { KeybindingsSettings } from '@/components/keybindings/KeybindingsSettings';
import { soundManager, playSound } from '@/lib/sounds';
import { SoundEffect } from '@/lib/sounds';
import { useTerminalConfigStore } from '@/store/terminalConfigStore';

export function Settings() {
  const { config, setConfig, loadConfig } = useTerminalConfigStore();
  const [settings, setSettings] = useState({
    // 终端设置
    terminalFont: 'monospace',
    terminalFontSize: 14,
    terminalScrollback: 1000,
    cursorBlink: true,
    copyOnSelect: false,

    // 外观设置
    theme: 'system',

    // 通知设置
    notifications: true,
    soundEffects: soundManager.isEnabled(),

    // 会话设置
    autoSaveSessions: true,
  });

  // 加载配置
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSwitchChange = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    // 如果是音效设置，更新音效管理器
    if (key === 'soundEffects') {
      soundManager.setEnabled(value);
      if (value) {
        playSound(SoundEffect.SUCCESS);
      }
    } else if (value) {
      // 其他开关打开时播放轻微点击音
      playSound(SoundEffect.TOGGLE_SWITCH);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
          <SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8" />
          设置
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          配置应用偏好和终端选项
        </p>
      </div>

      {/* 设置选项卡 */}
      <Tabs defaultValue="appearance" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-1 h-auto">
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            外观
          </TabsTrigger>
          <TabsTrigger value="terminal" className="gap-2">
            <Terminal className="h-4 w-4" />
            终端
          </TabsTrigger>
          <TabsTrigger value="session" className="gap-2">
            <Users className="h-4 w-4" />
            会话
          </TabsTrigger>
          <TabsTrigger value="keybindings" className="gap-2">
            <Keyboard className="h-4 w-4" />
            快捷键
          </TabsTrigger>
          <TabsTrigger value="about" className="gap-2">
            <Info className="h-4 w-4" />
            关于
          </TabsTrigger>
        </TabsList>

        {/* 外观设置 */}
        <TabsContent value="appearance" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="theme">主题模式</Label>
                <p className="text-sm text-muted-foreground">
                  选择应用的主题外观
                </p>
              </div>
              <ModeToggle />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">通知</Label>
                <p className="text-sm text-muted-foreground">
                  接收连接状态和错误通知
                </p>
              </div>
              <Switch
                id="notifications"
                checked={settings.notifications}
                onCheckedChange={(checked) => handleSwitchChange('notifications', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound">音效</Label>
                <p className="text-sm text-muted-foreground">
                  播放操作反馈音效
                </p>
              </div>
              <Switch
                id="sound"
                checked={settings.soundEffects}
                onCheckedChange={(checked) => handleSwitchChange('soundEffects', checked)}
              />
            </div>
          </div>
        </TabsContent>

        {/* 终端设置 */}
        <TabsContent value="terminal" className="space-y-6">
          <TerminalSettings />
        </TabsContent>

        {/* 会话设置 */}
        <TabsContent value="session" className="space-y-6">
          <div className="space-y-4">
            <Separator />

            <div className="space-y-2">
              <Label htmlFor="keepalive">心跳间隔</Label>
              <p className="text-sm text-muted-foreground">
                保持 SSH 连接活跃的间隔秒数: {config.keepAliveInterval}s
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {[0, 15, 30, 60, 120].map((value) => (
                  <Button
                    key={value}
                    variant={config.keepAliveInterval === value ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 min-w-16 touch-manipulation"
                    onClick={() => setConfig({ keepAliveInterval: value })}
                  >
                    {value === 0 ? '禁用' : `${value}s`}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="rounded-lg border p-4 bg-muted/20">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                连接提示
              </h3>
              <p className="text-sm text-muted-foreground">
                启用心跳功能可以防止长时间空闲导致 SSH 连接断开。
                建议设置为 30-60 秒以平衡性能和连接稳定性。
                设置为 0 可以禁用心跳功能。
              </p>
            </div>
          </div>
        </TabsContent>

        {/* 快捷键设置 */}
        <TabsContent value="keybindings" className="space-y-6">
          <KeybindingsSettings />
        </TabsContent>

        {/* 关于 */}
        <TabsContent value="about" className="space-y-6">
          <div className="space-y-4">
            <div className="rounded-lg border p-6 bg-muted/20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Terminal className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">SSH Terminal</h2>
              <p className="text-muted-foreground mt-1">版本 1.0.0</p>
              <p className="text-sm text-muted-foreground mt-4 max-w-md mx-auto">
                基于 Tauri 2.0 和 React 19 构建的现代化 SSH 终端管理工具
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold">技术栈</h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 text-sm">
                <div className="rounded border p-3 bg-muted/20">
                  <p className="font-medium">前端</p>
                  <p className="text-muted-foreground text-xs">React 19</p>
                </div>
                <div className="rounded border p-3 bg-muted/20">
                  <p className="font-medium">后端</p>
                  <p className="text-muted-foreground text-xs">Tauri 2.0</p>
                </div>
                <div className="rounded border p-3 bg-muted/20">
                  <p className="font-medium">UI 库</p>
                  <p className="text-muted-foreground text-xs">shadcn/ui</p>
                </div>
                <div className="rounded border p-3 bg-muted/20">
                  <p className="font-medium">终端</p>
                  <p className="text-muted-foreground text-xs">xterm.js</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="text-center text-sm text-muted-foreground">
              <p>© 2025 SSH Terminal. All rights reserved.</p>
              <p className="mt-1">
                Made with ❤️ using Tauri and React
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
