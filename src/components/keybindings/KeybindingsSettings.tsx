import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { KeybindingEditor } from './KeybindingEditor';
import { useKeybindingStore } from '@/store/keybindingStore';
import { KEYBINDING_ACTIONS } from '@/types/keybinding';
import { Search, FileDown, FileUp, RotateCcw } from 'lucide-react';

/**
 * 快捷键设置页面
 */
export function KeybindingsSettings() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const presets = useKeybindingStore((state) => state.presets);
  const loadPreset = useKeybindingStore((state) => state.loadPreset);
  const resetToDefault = useKeybindingStore((state) => state.resetToDefault);
  const exportConfig = useKeybindingStore((state) => state.exportConfig);
  const importConfig = useKeybindingStore((state) => state.importConfig);

  // 过滤动作
  const filteredActions = KEYBINDING_ACTIONS.filter((action) => {
    const matchesSearch =
      action.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || action.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // 按分类分组
  const actionsByCategory = filteredActions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = [];
    }
    acc[action.category].push(action);
    return acc;
  }, {} as Record<string, typeof KEYBINDING_ACTIONS>);

  // 分类名称映射
  const categoryNames: Record<string, string> = {
    global: '全局快捷键',
    terminal: '终端快捷键',
    session: '会话管理',
    sftp: 'SFTP 文件管理',
    other: '其他',
  };

  const handleExport = async () => {
    try {
      const configJson = await exportConfig();

      // 使用 Tauri 的文件对话框选择保存位置
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');

      const filePath = await save({
        filters: [
          {
            name: 'JSON Files',
            extensions: ['json']
          }
        ],
        defaultPath: `keybindings-${new Date().toISOString().slice(0, 10)}.json`
      });

      if (filePath) {
        await writeTextFile(filePath, configJson);
      }
    } catch (error) {
      console.error('导出失败:', error);
    }
  };

  const handleImport = async () => {
    try {
      // 使用 Tauri 的文件对话框选择导入文件
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { readTextFile } = await import('@tauri-apps/plugin-fs');

      const filePath = await open({
        filters: [
          {
            name: 'JSON Files',
            extensions: ['json']
          }
        ],
        multiple: false
      });

      if (filePath) {
        const text = await readTextFile(filePath as string);
        await importConfig(text);
      }
    } catch (error) {
      console.error('导入失败:', error);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      {/* 标题和操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">快捷键设置</h2>
          <p className="text-sm text-muted-foreground">
            自定义应用快捷键，提升操作效率
          </p>
        </div>

        <div className="flex gap-2">
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有分类</SelectItem>
              <SelectItem value="global">全局</SelectItem>
              <SelectItem value="terminal">终端</SelectItem>
              <SelectItem value="session">会话</SelectItem>
              <SelectItem value="sftp">SFTP</SelectItem>
            </SelectContent>
          </Select>

          <Select
            defaultValue="default"
            onValueChange={(value) => {
              if (value !== 'default') {
                loadPreset(value);
              }
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="加载预设" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">加载预设</SelectItem>
              {presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleExport} title="导出配置">
            <FileDown className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="icon" onClick={handleImport} title="导入配置">
            <FileUp className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="icon" onClick={resetToDefault} title="重置为默认">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="搜索快捷键..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 快捷键列表 */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 pr-4">
          {Object.entries(actionsByCategory).map(([category, actions]) => (
            <div key={category}>
              <h3 className="mb-3 text-lg font-semibold">
                {categoryNames[category] || category}
              </h3>
              <div className="space-y-2">
                {actions.map((action) => (
                  <KeybindingEditor key={action.id} actionId={action.id} />
                ))}
              </div>
            </div>
          ))}

          {filteredActions.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              没有找到匹配的快捷键
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
