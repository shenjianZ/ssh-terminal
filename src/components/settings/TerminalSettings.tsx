import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTerminalConfigStore } from '@/store/terminalConfigStore';
import { TERMINAL_THEMES, AVAILABLE_FONTS } from '@/config/themes';
import { ResetIcon, MinusIcon, PlusIcon } from '@radix-ui/react-icons';
import { playSound } from '@/lib/sounds';
import { SoundEffect } from '@/lib/sounds';
import { invoke } from '@tauri-apps/api/core';
import type { TerminalConfig } from '@/types/terminal';

interface SliderControlProps {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

function SliderControl({ label, value, unit, min, max, step, onChange }: SliderControlProps) {
  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    playSound(SoundEffect.TOGGLE_SWITCH);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    playSound(SoundEffect.TOGGLE_SWITCH);
    onChange(newValue);
  };

  const handleSliderChange = ([newValue]: number[]) => {
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label} ({value}{unit})</Label>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleDecrement}
          disabled={value <= min}
        >
          <MinusIcon className="h-4 w-4" />
        </Button>
        <Slider
          value={[value]}
          onValueChange={handleSliderChange}
          onPointerUp={() => playSound(SoundEffect.TOGGLE_SWITCH)}
          min={min}
          max={max}
          step={step}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleIncrement}
          disabled={value >= max}
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function TerminalSettings() {
  const { config, setConfig, setTheme } = useTerminalConfigStore();

  const handleReset = async () => {
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
    <div className="space-y-6">
      {/* 顶部标题和重置按钮 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">终端设置</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="gap-2"
        >
          <ResetIcon className="h-4 w-4" />
          恢复默认
        </Button>
      </div>

      {/* 主题选择 */}
      <Card>
        <CardHeader>
          <CardTitle>主题</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.values(TERMINAL_THEMES).map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  setTheme(theme.id);
                  playSound(SoundEffect.BUTTON_CLICK);
                }}
                className={`
                  relative p-4 rounded-lg border-2 transition-all
                  hover:shadow-md
                  ${config.themeId === theme.id
                    ? 'border-primary shadow-md'
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <div
                  className="w-full h-16 rounded mb-2"
                  style={{ backgroundColor: theme.preview }}
                />
                <div className="text-sm font-medium">{theme.name}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 字体设置 */}
      <Card>
        <CardHeader>
          <CardTitle>字体</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>字体家族</Label>
            <Select
              value={config.fontFamily}
              onValueChange={(value) => {
                setConfig({ fontFamily: value });
                playSound(SoundEffect.BUTTON_CLICK);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_FONTS.map((font) => (
                  <SelectItem key={font.id} value={font.family}>
                    {font.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SliderControl
            label="字号"
            value={config.fontSize}
            unit="px"
            min={10}
            max={24}
            step={1}
            onChange={(fontSize) => setConfig({ fontSize })}
          />

          <SliderControl
            label="字重"
            value={config.fontWeight}
            min={100}
            max={900}
            step={100}
            onChange={(fontWeight) => setConfig({ fontWeight })}
          />

          <SliderControl
            label="行高"
            value={config.lineHeight * 100}
            min={100}
            max={180}
            step={5}
            onChange={(lineHeight) => setConfig({ lineHeight: lineHeight / 100 })}
          />

          <SliderControl
            label="字间距"
            value={config.letterSpacing}
            unit="px"
            min={-2}
            max={5}
            step={0.5}
            onChange={(letterSpacing) => setConfig({ letterSpacing })}
          />
        </CardContent>
      </Card>

      {/* 光标设置 */}
      <Card>
        <CardHeader>
          <CardTitle>光标</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="cursor-blink">光标闪烁</Label>
            <Switch
              id="cursor-blink"
              checked={config.cursorBlink}
              onCheckedChange={(cursorBlink) => {
                setConfig({ cursorBlink });
                playSound(SoundEffect.TOGGLE_SWITCH);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>光标样式</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['block', 'underline', 'bar'] as const).map((style) => (
                <Button
                  key={style}
                  variant={config.cursorStyle === style ? 'default' : 'outline'}
                  onClick={() => {
                    setConfig({ cursorStyle: style });
                    playSound(SoundEffect.BUTTON_CLICK);
                  }}
                  className="w-full"
                >
                  {style === 'block' ? '方块' : style === 'underline' ? '下划线' : '竖线'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 连接设置 */}
      <Card>
        <CardHeader>
          <CardTitle>连接</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>心跳间隔</Label>
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
                  onClick={() => {
                    setConfig({ keepAliveInterval: value });
                    playSound(SoundEffect.BUTTON_CLICK);
                  }}
                >
                  {value === 0 ? '禁用' : `${value}s`}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-3 bg-muted/20">
            <p className="text-xs text-muted-foreground">
              💡 启用心跳功能可以防止长时间空闲导致 SSH 连接断开。
              建议设置为 30-60 秒以平衡性能和连接稳定性。
              设置为 0 可以禁用心跳功能。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 其他设置 */}
      <Card>
        <CardHeader>
          <CardTitle>其他</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SliderControl
            label="内边距"
            value={config.padding}
            unit="px"
            min={0}
            max={32}
            step={4}
            onChange={(padding) => setConfig({ padding })}
          />

          <SliderControl
            label="滚动缓冲"
            value={config.scrollback}
            unit=" 行"
            min={100}
            max={50000}
            step={100}
            onChange={(scrollback) => setConfig({ scrollback })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
