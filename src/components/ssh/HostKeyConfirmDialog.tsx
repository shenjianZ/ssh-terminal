import { useState } from 'react';
import { AlertTriangle, Fingerprint, CheckCircle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface HostKeyConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  host: string;
  fingerprint: string;
  keyType: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function HostKeyConfirmDialog({
  open,
  onOpenChange,
  host,
  fingerprint,
  keyType,
  onConfirm,
  onCancel,
}: HostKeyConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            主机密钥验证
          </DialogTitle>
          <DialogDescription>
            首次连接到此主机，需要确认其身份
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
            <Fingerprint className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="text-sm font-medium">主机信息</div>
              <div className="text-xs text-muted-foreground font-mono">{host}</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="text-sm font-medium">密钥类型</div>
              <div className="text-xs text-muted-foreground font-mono">{keyType}</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
            <Fingerprint className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="text-sm font-medium">指纹</div>
              <div className="text-xs text-muted-foreground font-mono break-all">{fingerprint}</div>
            </div>
          </div>

          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              <strong>安全提示：</strong>请确认此指纹是否与服务器管理员提供的一致。
              如果不确定，请联系服务器管理员验证。
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            <XCircle className="h-4 w-4 mr-2" />
            取消连接
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            确认并连接
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}