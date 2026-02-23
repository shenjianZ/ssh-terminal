import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';

/**
 * 快捷键设置页面
 */
export function KeybindingsSettings() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const presets = useKeybindingStore((state) => state.presets);
  const loadPreset = useKeybindingStore((state) => state.loadPreset);
  const resetToDefault = useKeybindingStore((state) => state.resetToDefault);
  const exportConfig = useKeybindingStore((state) => state.exportConfig);
  const importConfig = useKeybindingStore((state) => state.importConfig);

  // 获取动作名称
  const getActionName = (actionId: string): string => {
    const [category, action] = actionId.split('.');
    return t(`action.keybinding.${category}.${action}.name`);
  };

  // 获取动作描述
  const getActionDescription = (actionId: string): string => {
    const [category, action] = actionId.split('.');
    return t(`action.keybinding.${category}.${action}.description`);
  };

  // 过滤动作
  const filteredActions = KEYBINDING_ACTIONS.filter((action) => {
    const actionName = getActionName(action.id);
    const actionDescription = getActionDescription(action.id);
    const matchesSearch =
      actionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      actionDescription.toLowerCase().includes(searchQuery.toLowerCase());

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
    global: t('settings.keybindings.categoryName.global'),
    terminal: t('settings.keybindings.categoryName.terminal'),
    session: t('settings.keybindings.categoryName.session'),
    sftp: t('settings.keybindings.categoryName.sftp'),
    other: t('settings.keybindings.categoryName.other'),
  };

  const handleExport = async () => {
    try {
      const configJson = await exportConfig();

      // 使用 Tauri 的文件对话框选择保存位置
      const filePath = await save({
        filters: [
          {
            name: t('settings.keybindings.fileType'),
            extensions: ['json']
          }
        ],
        defaultPath: t('settings.keybindings.defaultFileName', { date: new Date().toISOString().slice(0, 10) })
      });

      if (filePath) {
        await writeTextFile(filePath, configJson);
      }
    } catch (error) {
      console.error(t('settings.keybindings.exportFailed'), error);
    }
  };

  const handleImport = async () => {
    try {
      // 使用 Tauri 的文件对话框选择导入文件
      const filePath = await open({
        filters: [
          {
            name: t('settings.keybindings.fileType'),
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
      console.error(t('settings.keybindings.importFailed'), error);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      {/* 标题和操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('settings.keybindings.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('settings.keybindings.description')}
          </p>
        </div>

        <div className="flex gap-2">
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t('settings.keybindings.selectCategory')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('settings.keybindings.category.all')}</SelectItem>
              <SelectItem value="global">{t('settings.keybindings.category.global')}</SelectItem>
              <SelectItem value="terminal">{t('settings.keybindings.category.terminal')}</SelectItem>
              <SelectItem value="session">{t('settings.keybindings.category.session')}</SelectItem>
              <SelectItem value="sftp">{t('settings.keybindings.category.sftp')}</SelectItem>
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
              <SelectValue placeholder={t('settings.keybindings.loadPreset')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">{t('settings.keybindings.loadPreset')}</SelectItem>
              <SelectItem value="default">{t('settings.keybindings.loadPreset')}</SelectItem>
              {presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleExport} title={t('settings.keybindings.export')}>
            <FileDown className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="icon" onClick={handleImport} title={t('settings.keybindings.import')}>
            <FileUp className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="icon" onClick={resetToDefault} title={t('settings.keybindings.reset')}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t('settings.keybindings.searchPlaceholder')}
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
                  <KeybindingEditor 
                    key={action.id} 
                    actionId={action.id}
                    name={getActionName(action.id)}
                    description={getActionDescription(action.id)}
                  />
                ))}
              </div>
            </div>
          ))}

          {filteredActions.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              {t('settings.keybindings.noResults')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}