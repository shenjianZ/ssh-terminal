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
import { Edit, Loader2 } from 'lucide-react';
import type { SessionInfo, SessionConfig } from '@/types/ssh';
import { toast } from 'sonner';

interface EditSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: SessionInfo | null;
  onUpdate: (config: Partial<SessionConfig>) => Promise<void>;
}

export function EditSessionDialog({
  open,
  onOpenChange,
  session,
  onUpdate,
}: EditSessionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: '22',
    username: '',
    group: '默认分组',
    password: '',
  });

  // 当session变化时，更新表单数据
  useEffect(() => {
    if (session) {
      setFormData({
        name: session.name,
        host: session.host,
        port: session.port.toString(),
        username: session.username,
        group: session.group || '默认分组',
        password: '',
      });
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.host || !formData.username) {
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

      // 如果输入了新密码，则更新认证信息
      if (formData.password) {
        updates.authMethod = {
          Password: { password: formData.password }
        };
        updates.password = formData.password;
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
      <DialogContent className="max-w-md" hideCloseButton>
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

          {/* 密码 */}
          <div className="space-y-2">
            <Label htmlFor="edit-password">密码（可选）</Label>
            <Input
              id="edit-password"
              type="password"
              placeholder="输入新密码以更新密码认证"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              留空表示不更新密码，输入新密码将更新认证信息
            </p>
          </div>

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