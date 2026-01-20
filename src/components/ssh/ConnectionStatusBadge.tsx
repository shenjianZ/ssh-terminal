import { Badge } from '@/components/ui/badge';
import { SessionStatus } from '@/types/ssh';
import { cn } from '@/lib/utils';
import { memo } from 'react';

interface ConnectionStatusBadgeProps {
  status: SessionStatus;
  className?: string;
}

export const ConnectionStatusBadge = memo(function ConnectionStatusBadge({ status, className }: ConnectionStatusBadgeProps) {
  const statusConfig = {
    connected: { label: '已连接', className: 'badge-connected' },
    connecting: { label: '连接中', className: 'badge-connecting' },
    disconnected: { label: '已断开', className: 'badge-disconnected' },
    error: { label: '错误', className: 'badge-error' },
  };

  const config = statusConfig[status] || statusConfig.disconnected;

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
});
