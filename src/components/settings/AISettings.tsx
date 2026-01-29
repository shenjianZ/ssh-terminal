// AI 设置组件

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, CheckCircle, XCircle, Bot, RotateCcw, Plus, Trash2, ChevronDown } from 'lucide-react';
import { useAIStore } from '@/store/aiStore';
import { AIClient } from '@/lib/ai/aiClient';
import { toast } from 'sonner';
import { playSound } from '@/lib/sounds';
import { SoundEffect } from '@/lib/sounds';
import { useState, useEffect } from 'react';
import type { AIProviderConfig, AIProviderType } from '@/types/ai';
import { AICachePanel } from '@/components/AICachePanel';

export function AISettings() {
  const {
    config,
    getDefaultConfig,
    saveConfig,
  } = useAIStore();

  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  // 本地状态
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [defaultProvider, setDefaultProvider] = useState<string>('');

  // 展开状态（独立于 enabled 状态）
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({});

  // 添加新服务对话框状态
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newProviderType, setNewProviderType] = useState('');
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderIsLocal, setNewProviderIsLocal] = useState(false);

  // 同步 store 的 config 到本地状态
  useEffect(() => {
    if (config) {
      setDefaultProvider(config.defaultProvider);
      setProviders(config.providers);
    }
  }, [config]);

  // 保存配置
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveConfig({
        providers,
        defaultProvider,
        shortcuts: {
          explainCommand: 'Ctrl+Shift+A',
          openChat: 'Ctrl+Shift+I',
          nlToCommand: 'Ctrl+Shift+N',
        },
      });
      playSound(SoundEffect.SUCCESS);
      toast.success('AI 配置已保存');
    } catch (error) {
      playSound(SoundEffect.ERROR);
      toast.error('保存配置失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 恢复默认
  const handleReset = async () => {
    const defaultConfig = await getDefaultConfig();
    setProviders(defaultConfig.providers);
    setDefaultProvider(defaultConfig.defaultProvider);
    playSound(SoundEffect.SUCCESS);
    toast.success('已恢复默认配置');
  };

  // 测试连接
  const handleTestConnection = async (providerId: string) => {
    setTestingProvider(providerId);

    // 从本地状态获取 provider（用户当前正在编辑的配置）
    const provider = providers.find((p) => p.id === providerId);
    if (!provider) {
      toast.error('Provider not found');
      setTestingProvider(null);
      return;
    }

    try {
      console.log('[AISettings] Testing connection for provider:', provider);
      const success = await AIClient.testConnection(provider);
      console.log('[AISettings] Test connection result:', success);

      setTestResults((prev) => ({ ...prev, [providerId]: success }));

      if (success) {
        playSound(SoundEffect.SUCCESS);
        toast.success('连接测试成功');
      } else {
        playSound(SoundEffect.ERROR);
        toast.error('连接测试失败');
      }
    } catch (error) {
      console.error('[AISettings] Test connection error:', error);
      setTestResults((prev) => ({ ...prev, [providerId]: false }));
      playSound(SoundEffect.ERROR);
      toast.error(`连接测试失败: ${error}`);
    } finally {
      setTestingProvider(null);
    }
  };

  // 更新 Provider 配置
  const updateProvider = (id: string, updates: Partial<AIProviderConfig>) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  // 保存启用状态和默认服务
  const saveEnabledState = async (newProviders: AIProviderConfig[], newDefaultProvider: string) => {
    try {
      await saveConfig({
        providers: newProviders,
        defaultProvider: newDefaultProvider,
        shortcuts: {
          explainCommand: 'Ctrl+Shift+A',
          openChat: 'Ctrl+Shift+I',
          nlToCommand: 'Ctrl+Shift+N',
        },
      });
      playSound(SoundEffect.SUCCESS);
    } catch (error) {
      playSound(SoundEffect.ERROR);
      toast.error('保存配置失败');
    }
  };

  // 切换展开/收起配置详情
  const toggleExpand = (providerId: string) => {
    setExpandedProviders((prev) => ({
      ...prev,
      [providerId]: !prev[providerId],
    }));
    playSound(SoundEffect.TOGGLE_SWITCH);
  };

  // 添加新服务
  const handleAddProvider = () => {
    if (!newProviderType.trim()) {
      toast.error('请输入服务类型');
      return;
    }

    if (!newProviderName.trim()) {
      toast.error('请输入服务名称');
      return;
    }

    const newId = `${newProviderType}-${Date.now()}`;
    const newProvider: AIProviderConfig = {
      id: newId,
      type: newProviderType as AIProviderType,
      name: newProviderName.trim(),
      model: '',
      enabled: false,
      temperature: 0.7,
      maxTokens: 2000,
    };

    const newProviders = [...providers, newProvider];

    setProviders(newProviders);
    setNewProviderType('');
    setNewProviderName('');
    setNewProviderIsLocal(false);
    setIsAddDialogOpen(false);
    playSound(SoundEffect.SUCCESS);
    toast.success('已添加新服务（请填写配置后点击"保存配置"）');
  };

  // 删除服务
  const handleDeleteProvider = (providerId: string) => {
    const newProviders = providers.filter((p) => p.id !== providerId);

    // 如果删除的是默认服务，清除默认选择
    let newDefaultProvider = defaultProvider;
    if (defaultProvider === providerId) {
      const remainingEnabled = newProviders.filter((p) => p.enabled);
      if (remainingEnabled.length > 0) {
        newDefaultProvider = remainingEnabled[0].id;
      } else {
        newDefaultProvider = '';
      }
    }

    setProviders(newProviders);
    setDefaultProvider(newDefaultProvider);
    toast.success('已删除服务');

    // 自动保存（删除会影响启用状态，保存时会播放提示音）
    saveEnabledState(newProviders, newDefaultProvider);
  };

  // 获取 Provider 类型标签
  const getProviderTypeLabel = (type: string) => {
    switch (type) {
      case 'openai':
        return 'OpenAI';
      case 'ollama':
        return 'Ollama (本地)';
      case 'qwen':
        return '通义千问';
      case 'wenxin':
        return '文心一言';
      default:
        return type;
    }
  };

  // 获取推荐的模型列表
  const getRecommendedModels = (type: string) => {
    switch (type) {
      case 'openai':
        return ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'];
      case 'ollama':
        return ['llama3.2', 'llama3.1', 'mistral', 'qwen2.5', 'deepseek-coder'];
      case 'qwen':
        return ['qwen-turbo', 'qwen-plus', 'qwen-max'];
      case 'wenxin':
        return ['ERNIE-Bot-turbo', 'ERNIE-Bot', 'ERNIE-Bot-4'];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* 顶部标题和操作按钮 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">AI 设置</h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            恢复默认
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Bot className="h-4 w-4" />
                保存配置
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 默认 Provider 选择 */}
      <Card>
        <CardHeader>
          <CardTitle>默认 AI 服务</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="default-provider">选择默认使用的 AI 服务</Label>
            <Select
              value={defaultProvider}
              onValueChange={async (value) => {
                setDefaultProvider(value);
                // 自动保存默认服务选择
                saveEnabledState(providers, value);
              }}
            >
              <SelectTrigger id="default-provider">
                <SelectValue placeholder="选择默认 AI 服务" />
              </SelectTrigger>
              <SelectContent>
                {providers
                  .filter((p) => p.enabled)
                  .map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              启用的服务将作为 AI 功能的默认提供者
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Provider 列表 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">已配置的 AI 服务</Label>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            添加新服务
          </Button>
        </div>

        {/* 添加新服务对话框 */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加 AI 服务</DialogTitle>
              <DialogDescription>
                选择服务类型并输入名称
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="provider-type">服务类型</Label>
                <Input
                  id="provider-type"
                  value={newProviderType}
                  onChange={(e) => setNewProviderType(e.target.value)}
                  placeholder="例如: openai, ollama, qwen, claude"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider-mode">服务形式</Label>
                <Select
                  value={newProviderIsLocal ? 'local' : 'api'}
                  onValueChange={(value) => setNewProviderIsLocal(value === 'local')}
                >
                  <SelectTrigger id="provider-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="api">API 服务（需要 API Key）</SelectItem>
                    <SelectItem value="local">本地服务（不需要 API Key）</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {newProviderIsLocal
                    ? '本地服务运行在内网，不需要配置 API Key'
                    : 'API 服务需要配置 API Key 进行身份验证'}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider-name">服务名称</Label>
                <Input
                  id="provider-name"
                  value={newProviderName}
                  onChange={(e) => setNewProviderName(e.target.value)}
                  placeholder="例如: 我的 OpenAI"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                取消
              </Button>
              <Button onClick={handleAddProvider}>
                添加
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {getProviderTypeLabel(provider.type)}
                  <span className="text-sm text-muted-foreground font-normal">
                    ({provider.name})
                  </span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  {/* 测试结果 */}
                  {testResults[provider.id] !== undefined && (
                    testResults[provider.id] ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )
                  )}
                  {/* 展开/收起按钮 */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleExpand(provider.id)}
                    className="p-2 h-8 w-8"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        expandedProviders[provider.id] ? 'rotate-180' : ''
                      }`}
                    />
                  </Button>
                  {/* 启用开关 */}
                  <Switch
                    checked={provider.enabled}
                    onCheckedChange={async (enabled) => {
                      const newProviders = providers.map((p) =>
                        p.id === provider.id ? { ...p, enabled } : p
                      );

                      // 如果禁用的是当前默认服务，需要切换到其他启用的服务
                      let newDefaultProvider = defaultProvider;
                      if (!enabled && defaultProvider === provider.id) {
                        const remainingEnabled = newProviders.filter(
                          (p) => p.enabled && p.id !== provider.id
                        );
                        if (remainingEnabled.length > 0) {
                          newDefaultProvider = remainingEnabled[0].id;
                          setDefaultProvider(newDefaultProvider);
                        } else {
                          newDefaultProvider = '';
                          setDefaultProvider('');
                        }
                      }

                      setProviders(newProviders);

                      // 自动保存启用状态（保存时会播放提示音）
                      saveEnabledState(newProviders, newDefaultProvider);
                    }}
                  />
                  {/* 测试按钮 */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestConnection(provider.id)}
                    disabled={!provider.enabled || testingProvider === provider.id}
                  >
                    {testingProvider === provider.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      '测试连接'
                    )}
                  </Button>
                  {/* 删除按钮 */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteProvider(provider.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* 配置项 - 使用展开状态而不是 enabled 状态 */}
            {expandedProviders[provider.id] && (
              <CardContent className="space-y-4">
                {/* API Key（除了 ollama 本地服务，其他都需要） */}
                {provider.type !== 'ollama' && (
                  <div className="space-y-2">
                    <Label htmlFor={`${provider.id}-apikey`}>API Key</Label>
                    <Input
                      id={`${provider.id}-apikey`}
                      type="password"
                      value={provider.apiKey || ''}
                      onChange={(e) =>
                        updateProvider(provider.id, { apiKey: e.target.value })
                      }
                      placeholder="sk-..."
                    />
                  </div>
                )}

                {/* Base URL（可选） */}
                <div className="space-y-2">
                  <Label htmlFor={`${provider.id}-baseurl`}>Base URL（可选）</Label>
                  <Input
                    id={`${provider.id}-baseurl`}
                    value={provider.baseUrl || ''}
                    onChange={(e) =>
                      updateProvider(provider.id, { baseUrl: e.target.value })
                    }
                    placeholder={
                      provider.type === 'ollama'
                        ? 'http://localhost:11434'
                        : 'https://api.openai.com/v1'
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    {provider.type === 'ollama'
                      ? 'Ollama 服务的地址（本地安装后默认为 http://localhost:11434）'
                      : 'API 的基础地址（通常不需要修改）'}
                  </p>
                </div>

                {/* 模型输入 */}
                <div className="space-y-2">
                  <Label htmlFor={`${provider.id}-model`}>模型</Label>
                  <Input
                    id={`${provider.id}-model`}
                    value={provider.model}
                    onChange={(e) => updateProvider(provider.id, { model: e.target.value })}
                    placeholder="输入模型名称"
                  />
                  <p className="text-xs text-muted-foreground">
                    推荐模型: {getRecommendedModels(provider.type).join(', ')}
                  </p>
                </div>

                {/* Temperature */}
                <div className="space-y-2">
                  <Label htmlFor={`${provider.id}-temperature`}>
                    Temperature ({provider.temperature || 0.7})
                  </Label>
                  <Input
                    id={`${provider.id}-temperature`}
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={provider.temperature ?? 0.7}
                    onChange={(e) =>
                      updateProvider(provider.id, {
                        temperature: parseFloat(e.target.value) || 0.7
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    控制响应的随机性（0-2，值越高越随机）
                  </p>
                </div>

                {/* Max Tokens */}
                <div className="space-y-2">
                  <Label htmlFor={`${provider.id}-maxtokens`}>
                    Max Tokens ({provider.maxTokens || 2000})
                  </Label>
                  <Input
                    id={`${provider.id}-maxtokens`}
                    type="number"
                    min="1"
                    max="32000"
                    step="100"
                    value={provider.maxTokens ?? 2000}
                    onChange={(e) =>
                      updateProvider(provider.id, {
                        maxTokens: parseInt(e.target.value) || 2000
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    单次响应的最大 token 数（1-32000）
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* AI Provider 缓存管理 */}
      <AICachePanel />

      {/* 使用提示 */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Bot className="h-5 w-5" />
              💡 使用提示
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• <strong>OpenAI</strong>：需要 API Key，响应速度快，质量高，按使用量付费</p>
              <p>• <strong>Ollama</strong>：本地运行，完全免费，数据隐私安全，需要先安装 Ollama</p>
              <p>• 建议先测试连接，确保配置正确后再使用 AI 功能</p>
              <p>• 可以同时配置多个 Provider，随时切换使用</p>
              <p>• 修改配置后记得点击"保存配置"按钮</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t space-y-2">
            <h4 className="font-medium">AI 功能快捷键：</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 命令解释：选中命令后按 <kbd className="px-1 py-0.5 rounded bg-muted">Ctrl+Shift+A</kbd></li>
              <li>• 自然语言转命令：输入 <kbd className="px-1 py-0.5 rounded bg-muted">#</kbd> + 描述</li>
              <li>• AI 对话面板：按 <kbd className="px-1 py-0.5 rounded bg-muted">Ctrl+Shift+I</kbd></li>
              <li>• 错误分析：自动检测并提供解决方案</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
