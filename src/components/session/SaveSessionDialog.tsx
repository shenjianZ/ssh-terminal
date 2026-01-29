import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Loader2 } from 'lucide-react';
import type { SessionConfig } from '@/types/ssh';
import { toast } from 'sonner';

interface SaveSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: SessionConfig) => Promise<void>;
}

export function SaveSessionDialog({
  open,
  onOpenChange,
  onSave,
}: SaveSessionDialogProps) {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: '22',
    username: '',
    group: '默认分组',
    authMethod: 'password',
    password: '',
    privateKeyPath: '',
    passphrase: '',
    terminalType: 'xterm-256color',
  });

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      host: '',
      port: '22',
      username: '',
      group: '默认分组',
      authMethod: 'password',
      password: '',
      privateKeyPath: '',
      passphrase: '',
      terminalType: 'xterm-256color',
    });
  };

  // 当对话框关闭时重置表单
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 基础验证
    if (!formData.name || !formData.host || !formData.username) {
      return;
    }

    if (formData.authMethod === 'password' && !formData.password) {
      return;
    }

    if (formData.authMethod === 'publicKey' && !formData.privateKeyPath) {
      return;
    }

    setLoading(true);

    try {
      await onSave({
        name: formData.name,
        host: formData.host,
        port: parseInt(formData.port),
        username: formData.username,
        authMethod: formData.authMethod === 'password'
          ? { password: { password: formData.password || '' } }
          : { publicKey: { privateKeyPath: formData.privateKeyPath || '', passphrase: formData.passphrase } },
        password: formData.authMethod === 'password' ? formData.password : undefined,
        privateKeyPath: formData.authMethod === 'publicKey' ? formData.privateKeyPath : undefined,
        passphrase: formData.authMethod === 'publicKey' ? formData.passphrase : undefined,
        terminalType: formData.terminalType,
        group: formData.group || '默认分组',
      });

      // 保存成功后关闭对话框并重置表单
      toast.success('会话保存成功');
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save session:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error('会话保存失败', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // 自动生成名称
  const generateName = () => {
    if (formData.host && formData.username) {
      setFormData(prev => ({
        ...prev,
        name: `${formData.username}@${formData.host}`,
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} closeOnClickOutside={false}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-primary" />
            保存会话配置
          </DialogTitle>
          <DialogDescription>
            保存 SSH 会话配置到本地，方便日后快速连接
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">基本配置</TabsTrigger>
              <TabsTrigger value="advanced">高级选项</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              {/* 会话名称 */}
              <div className="space-y-2">
                <Label htmlFor="save-name">
                  会话名称 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="save-name"
                  placeholder="例如: 生产服务器"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  为此连接配置指定一个易记的名称
                </p>
              </div>

              {/* 分组 */}
              <div className="space-y-2">
                <Label htmlFor="save-group">分组</Label>
                <Input
                  id="save-group"
                  placeholder="例如: 生产环境、测试环境"
                  value={formData.group}
                  onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  将会话分组管理，方便查找（默认：默认分组）
                </p>
              </div>

              {/* 主机地址 */}
              <div className="space-y-2">
                <Label htmlFor="save-host">
                  主机地址 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="save-host"
                  placeholder="192.168.1.100 或 example.com"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  onBlur={generateName}
                  required
                />
              </div>

              {/* 端口和用户名 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="save-port">
                    端口 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="save-port"
                    type="number"
                    min="1"
                    max="65535"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="save-username">
                    用户名 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="save-username"
                    placeholder="root"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    onBlur={generateName}
                    required
                  />
                </div>
              </div>

              {/* 认证方式 */}
              <div className="space-y-2">
                <Label htmlFor="save-auth">
                  认证方式 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.authMethod}
                  onValueChange={(value) => setFormData({ ...formData, authMethod: value })}
                >
                  <SelectTrigger id="save-auth">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="password">密码</SelectItem>
                    <SelectItem value="publicKey">公钥</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 密码认证 */}
              {formData.authMethod === 'password' && (
                <div className="space-y-2">
                  <Label htmlFor="save-password">
                    密码 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="save-password"
                    type="password"
                    placeholder="输入 SSH 密码"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    密码将被加密后保存到本地
                  </p>
                </div>
              )}

              {/* 公钥认证 */}
              {formData.authMethod === 'publicKey' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="save-key">
                      私钥路径 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="save-key"
                      placeholder="~/.ssh/id_rsa"
                      value={formData.privateKeyPath}
                      onChange={(e) => setFormData({ ...formData, privateKeyPath: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="save-passphrase">私钥密码（可选）</Label>
                    <Input
                      id="save-passphrase"
                      type="password"
                      placeholder="如果私钥有密码保护"
                      value={formData.passphrase}
                      onChange={(e) => setFormData({ ...formData, passphrase: e.target.value })}
                    />
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              {/* 终端类型 */}
              <div className="space-y-2">
                <Label htmlFor="save-terminal">终端类型</Label>
                <Select
                  value={formData.terminalType}
                  onValueChange={(value) => setFormData({ ...formData, terminalType: value })}
                >
                  <SelectTrigger id="save-terminal">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xterm-256color">xterm-256color</SelectItem>
                    <SelectItem value="xterm">xterm</SelectItem>
                    <SelectItem value="vt220">vt220</SelectItem>
                    <SelectItem value="vt100">vt100</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  指定终端模拟的类型，通常使用默认值即可
                </p>
              </div>

              <div className="rounded-lg border p-4 bg-muted/20">
                <h4 className="font-semibold mb-2">💡 保存说明</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 会话配置将加密保存到本地存储</li>
                  <li>• 密码使用 AES 加密后存储</li>
                  <li>• 保存后可在会话管理页面查看</li>
                  <li>• 支持编辑和删除已保存的会话</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  保存会话
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
