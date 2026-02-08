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
import { Edit, Loader2 } from 'lucide-react';
import type { SessionInfo, SessionConfig, AuthMethod } from '@/types/ssh';
import { toast } from 'sonner';

interface EditSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: SessionInfo | null;
  sessionConfig: SessionConfig | null;
  onUpdate: (config: Partial<SessionConfig>) => Promise<void>;
}

export function EditSessionDialog({
  open,
  onOpenChange,
  session,
  sessionConfig,
  onUpdate,
}: EditSessionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: '22',
    username: '',
    group: '默认分组',
    authMethod: 'password' as 'password' | 'publicKey',
    password: '',
    privateKeyPath: '',
    passphrase: '',
  });

  // 当配置变化时，更新表单数据
  useEffect(() => {
    if (sessionConfig && open) {
      // 确定认证方式
      let authMethodType: 'password' | 'publicKey' = 'password';

      // 更健壮的类型检查
      if (sessionConfig.authMethod && typeof sessionConfig.authMethod === 'object') {
        if ('password' in sessionConfig.authMethod) {
          authMethodType = 'password';
          console.log('[EditSessionDialog] 检测到密码认证');
        } else if ('publicKey' in sessionConfig.authMethod) {
          authMethodType = 'publicKey';
          console.log('[EditSessionDialog] 检测到公钥认证');
        } else {
          console.log('[EditSessionDialog] 未知的认证方式:', sessionConfig.authMethod);
        }
      }

      console.log('[EditSessionDialog] 设置认证方式为:', authMethodType);

      setFormData({
        name: sessionConfig.name,
        host: sessionConfig.host,
        port: sessionConfig.port.toString(),
        username: sessionConfig.username,
        group: sessionConfig.group || '默认分组',
        authMethod: authMethodType,
        password: '',
        privateKeyPath: '',
        passphrase: '',
      });
    } else if (session && open) {
      // 如果没有完整配置，使用 SessionInfo 的基本信息
      console.log('[EditSessionDialog] 没有完整配置，使用基本信息，默认密码认证');
      setFormData({
        name: session.name,
        host: session.host,
        port: session.port.toString(),
        username: session.username,
        group: session.group || '默认分组',
        authMethod: 'password',
        password: '',
        privateKeyPath: '',
        passphrase: '',
      });
    }
  }, [sessionConfig, session, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.host || !formData.username) {
      toast.error('请填写必填字段');
      return;
    }

    // 验证认证方式的必填字段
    if (formData.authMethod === 'password' && !formData.password) {
      toast.error('请输入密码');
      return;
    }
    if (formData.authMethod === 'publicKey' && !formData.privateKeyPath) {
      toast.error('请输入私钥路径');
      return;
    }

    setLoading(true);

    try {
      const updates: Partial<SessionConfig> = {
        name: formData.name,
        host: formData.host,
        port: parseInt(formData.port),
        username: formData.username,
        group: formData.group || '默认分组',
      };

      // 根据选择的认证方式更新认证信息
      if (formData.authMethod === 'password') {
        if (formData.password) {
          updates.authMethod = {
            password: { password: formData.password }
          };
        }
        // 如果没有输入新密码，保持原有的认证方式
      } else if (formData.authMethod === 'publicKey') {
        updates.authMethod = {
          publicKey: {
            privateKeyPath: formData.privateKeyPath,
            passphrase: formData.passphrase || undefined,
          }
        };
      }

      await onUpdate(updates);
      toast.success('会话更新成功');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update session:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error('会话更新失败', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} closeOnClickOutside={false}>
      <DialogContent className="!w-[800px] max-h-[90vh] overflow-y-auto" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            编辑会话
          </DialogTitle>
          <DialogDescription>
            修改会话配置信息
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
            {/* 会话名称 */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                会话名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                placeholder="例如: 生产服务器"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* 主机地址 */}
            <div className="space-y-2">
              <Label htmlFor="edit-host">
                主机地址 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-host"
                placeholder="192.168.1.100 或 example.com"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                required
              />
            </div>

            {/* 端口 */}
            <div className="space-y-2">
              <Label htmlFor="edit-port">
                端口 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-port"
                type="number"
                min="1"
                max="65535"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                required
              />
            </div>

            {/* 用户名 */}
            <div className="space-y-2">
              <Label htmlFor="edit-username">
                用户名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-username"
                placeholder="例如: root"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            {/* 分组 */}
            <div className="space-y-2">
              <Label htmlFor="edit-group">分组</Label>
              <Input
                id="edit-group"
                placeholder="例如: 生产环境、测试环境"
                value={formData.group}
                onChange={(e) => setFormData({ ...formData, group: e.target.value })}
              />
            </div>

            {/* 认证方式 */}
            <div className="space-y-2">
              <Label htmlFor="edit-auth">认证方式</Label>
              <Select
                key={`auth-${formData.authMethod}`}
                value={formData.authMethod}
                onValueChange={(value: 'password' | 'publicKey') => setFormData({ ...formData, authMethod: value })}
              >
                <SelectTrigger id="edit-auth">
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
                <Label htmlFor="edit-password">
                  密码 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="输入 SSH 密码"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  请输入密码以完成认证配置
                </p>
              </div>
            )}

            {/* 公钥认证 */}
            {formData.authMethod === 'publicKey' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-key">
                    私钥路径 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-key"
                    placeholder="~/.ssh/id_rsa"
                    value={formData.privateKeyPath}
                    onChange={(e) => setFormData({ ...formData, privateKeyPath: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-passphrase">私钥密码（可选）</Label>
                  <Input
                    id="edit-passphrase"
                    type="password"
                    placeholder="如果私钥有密码保护"
                    value={formData.passphrase}
                    onChange={(e) => setFormData({ ...formData, passphrase: e.target.value })}
                  />
                </div>
              </>
            )}

            <DialogFooter>
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
                  '保存更改'
                )}
              </Button>
            </DialogFooter>
          </form>
      </DialogContent>
    </Dialog>
  );
}