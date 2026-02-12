import { useState, useEffect } from 'react';
import {
  Palette,
  Terminal,
  Keyboard,
  Info,
  Mic,
  Volume2,
  Github,
  RotateCcw,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModeToggle } from '@/components/mode-toggle';
import { useTheme } from '@/components/theme-provider';
import { TerminalSettings } from '@/components/settings/TerminalSettings';
import { KeybindingsSettings } from '@/components/keybindings/KeybindingsSettings';
import { AISettings } from '@/components/settings/AISettings';
import { soundManager, playSound } from '@/lib/sounds';
import { SoundEffect } from '@/lib/sounds';
import { useTerminalConfigStore } from '@/store/terminalConfigStore';
import { useAIStore } from '@/store/aiStore';
import { openUrl } from '@tauri-apps/plugin-opener';
import { invoke } from '@tauri-apps/api/core';
import type { TerminalConfig } from '@/types/terminal';

export function Settings() {
  const { config, setConfig, loadConfig } = useTerminalConfigStore();
  const { loadConfig: loadAIConfig } = useAIStore();
  const { setTheme } = useTheme();

  // 加载配置
  useEffect(() => {
    loadConfig();
    loadAIConfig();
  }, [loadConfig, loadAIConfig]);

  const handleSwitchChange = async (key: string, value: boolean) => {
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

    // 持久化到后端
    try {
      if (key === 'notifications') {
        await setConfig({ notificationsEnabled: value });
      } else if (key === 'soundEffects') {
        await setConfig({ soundEffectsEnabled: value });
      }
    } catch (error) {
      console.error('Failed to save setting:', error);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* 设置选项卡 */}
      <Tabs defaultValue="appearance" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-6 gap-1 h-auto">
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            外观
          </TabsTrigger>
          <TabsTrigger value="terminal" className="gap-2">
            <Terminal className="h-4 w-4" />
            终端
          </TabsTrigger>
          <TabsTrigger value="recording" className="gap-2">
            <Mic className="h-4 w-4" />
            录制
          </TabsTrigger>
          <TabsTrigger value="keybindings" className="gap-2">
            <Keyboard className="h-4 w-4" />
            快捷键
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Bot className="h-4 w-4" />
            AI
          </TabsTrigger>
          <TabsTrigger value="about" className="gap-2">
            <Info className="h-4 w-4" />
            关于
          </TabsTrigger>
        </TabsList>

        {/* 外观设置 */}
        <TabsContent value="appearance" className="space-y-6">
          {/* 顶部标题和重置按钮 */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">外观设置</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  const defaultConfig = await invoke<TerminalConfig>('storage_config_get_default');
                  // 使用 setTheme 方法确保 appTheme 正确设置
                  setTheme(defaultConfig.appTheme || 'system');
                  playSound(SoundEffect.SUCCESS);
                } catch (error) {
                  console.error('Failed to reset appearance config:', error);
                  playSound(SoundEffect.ERROR);
                }
              }}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              恢复默认
            </Button>
          </div>

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
                checked={config.notificationsEnabled}
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
                checked={config.soundEffectsEnabled}
                onCheckedChange={(checked) => handleSwitchChange('soundEffects', checked)}
              />
            </div>
          </div>
        </TabsContent>

        {/* 终端设置 */}
        <TabsContent value="terminal" className="space-y-6">
          <TerminalSettings />
        </TabsContent>

        {/* 录制设置 */}
        <TabsContent value="recording" className="space-y-6">
          {/* 顶部标题和重置按钮 */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">录制设置</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  const defaultConfig = await invoke<TerminalConfig>('storage_config_get_default');
                  await setConfig(defaultConfig);
                  playSound(SoundEffect.SUCCESS);
                } catch (error) {
                  console.error('Failed to reset config:', error);
                  playSound(SoundEffect.ERROR);
                }
              }}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              恢复默认
            </Button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="videoQuality">视频录制质量</Label>
              <p className="text-sm text-muted-foreground">
                选择录制视频的质量（影响视频文件大小）
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button
                  variant={config.videoQuality === 'low' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 min-w-24 touch-manipulation"
                  onClick={() => setConfig({ videoQuality: 'low' })}
                >
                  低 (500 Kbps)
                </Button>
                <Button
                  variant={config.videoQuality === 'medium' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 min-w-24 touch-manipulation"
                  onClick={() => setConfig({ videoQuality: 'medium' })}
                >
                  中 (2 Mbps)
                </Button>
                <Button
                  variant={config.videoQuality === 'high' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 min-w-24 touch-manipulation"
                  onClick={() => setConfig({ videoQuality: 'high' })}
                >
                  高 (5 Mbps)
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="videoFormat">视频录制格式</Label>
              <p className="text-sm text-muted-foreground">
                选择录制视频的格式（WebM 推荐用于网络播放）
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button
                  variant={config.videoFormat === 'webm' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 min-w-24 touch-manipulation"
                  onClick={() => setConfig({ videoFormat: 'webm' })}
                >
                  WebM (VP9)
                </Button>
                <Button
                  variant={config.videoFormat === 'mp4' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 min-w-24 touch-manipulation"
                  onClick={() => setConfig({ videoFormat: 'mp4' })}
                >
                  MP4 (H.264)
                </Button>
              </div>
            </div>

            <Separator />

            {/* 音频录制设置 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                录制麦克风
              </Label>
              <p className="text-sm text-muted-foreground">
                录制用户通过麦克风说话的声音（需要用户授权）
              </p>
              <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  <strong>⚠️ 重要提示：</strong>系统会自动过滤掉"立体声混音"等系统音频设备。
                  如果发现录制到了音乐或其他应用的声音，请检查系统音频设置，
                  确保选择了正确的麦克风设备而非混音设备。
                </p>
              </div>
              <Switch
                checked={config.recordMicrophone}
                onCheckedChange={(checked) => {
                  setConfig({ recordMicrophone: checked });
                  playSound(SoundEffect.TOGGLE_SWITCH);
                }}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                录制扬声器（系统音频）
              </Label>
              <p className="text-sm text-muted-foreground">
                录制系统播放的声音（Windows WASAPI Loopback Recording）
              </p>
              <Switch
                checked={config.recordSpeaker}
                onCheckedChange={(checked) => {
                  setConfig({ recordSpeaker: checked });
                  playSound(SoundEffect.TOGGLE_SWITCH);
                }}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>音频录制质量</Label>
              <p className="text-sm text-muted-foreground">
                选择录制音频的质量（影响音频文件大小）
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button
                  variant={config.audioQuality === 'low' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 min-w-24 touch-manipulation"
                  onClick={() => {
                    setConfig({ audioQuality: 'low' });
                    playSound(SoundEffect.BUTTON_CLICK);
                  }}
                  disabled={!config.recordMicrophone && !config.recordSpeaker}
                >
                  低 (64 Kbps)
                </Button>
                <Button
                  variant={config.audioQuality === 'medium' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 min-w-24 touch-manipulation"
                  onClick={() => {
                    setConfig({ audioQuality: 'medium' });
                    playSound(SoundEffect.BUTTON_CLICK);
                  }}
                  disabled={!config.recordMicrophone && !config.recordSpeaker}
                >
                  中 (128 Kbps)
                </Button>
                <Button
                  variant={config.audioQuality === 'high' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 min-w-24 touch-manipulation"
                  onClick={() => {
                    setConfig({ audioQuality: 'high' });
                    playSound(SoundEffect.BUTTON_CLICK);
                  }}
                  disabled={!config.recordMicrophone && !config.recordSpeaker}
                >
                  高 (256 Kbps)
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>音频采样率</Label>
              <p className="text-sm text-muted-foreground">
                选择录制音频的采样率（当前: {config.audioSampleRate} Hz）
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button
                  variant={config.audioSampleRate === 44100 ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 min-w-24 touch-manipulation"
                  onClick={() => {
                    setConfig({ audioSampleRate: 44100 });
                    playSound(SoundEffect.BUTTON_CLICK);
                  }}
                  disabled={!config.recordMicrophone && !config.recordSpeaker}
                >
                  44.1 kHz
                </Button>
                <Button
                  variant={config.audioSampleRate === 48000 ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 min-w-24 touch-manipulation"
                  onClick={() => {
                    setConfig({ audioSampleRate: 48000 });
                    playSound(SoundEffect.BUTTON_CLICK);
                  }}
                  disabled={!config.recordMicrophone && !config.recordSpeaker}
                >
                  48 kHz
                </Button>
                <Button
                  variant={config.audioSampleRate === 96000 ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 min-w-24 touch-manipulation"
                  onClick={() => {
                    setConfig({ audioSampleRate: 96000 });
                    playSound(SoundEffect.BUTTON_CLICK);
                  }}
                  disabled={!config.recordMicrophone && !config.recordSpeaker}
                >
                  96 kHz
                </Button>
              </div>
            </div>

            <Separator />

            <div className="rounded-lg border p-4 bg-muted/20">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                录制提示
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>音频录制需要浏览器权限。启用麦克风录制需要用户授权</li>
                <li>扬声器录制仅在支持 WASAPI Loopback Recording 的平台上可用（Windows）</li>
                <li>如果麦克风录制到了系统音频（音乐等），请在系统设置中检查默认录音设备</li>
                <li>建议在 Windows 设置中禁用"立体声混音"设备，避免误选</li>
              </ul>
              <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
                <strong>如何检查麦克风设备：</strong>
                打开 Windows 设置 → 系统 → 声音 → 输入设备，确认选择了正确的麦克风设备，而非"立体声混音"。
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 快捷键设置 */}
        <TabsContent value="keybindings" className="space-y-6">
          <KeybindingsSettings />
        </TabsContent>

        {/* AI 设置 */}
        <TabsContent value="ai" className="space-y-6">
          <AISettings />
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

            <div className="space-y-3">
              <h3 className="font-semibold">开源仓库</h3>
              <div className="rounded-lg border p-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Github className="h-5 w-5" />
                    <div>
                      <p className="font-medium">GitHub 仓库</p>
                      <p className="text-sm text-muted-foreground">shenjianZ/ssh-terminal</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openUrl('https://github.com/shenjianZ/ssh-terminal')}
                    className="gap-2"
                  >
                    <Github className="h-4 w-4" />
                    访问
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  欢迎访问 GitHub 仓库查看源代码、提交 Issue 或参与贡献
                </p>
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
