import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useSyncStore } from '@/store/syncStore';
import { useAuthStore } from '@/store/authStore';
import { useSessionStore } from '@/store/sessionStore';
import { useUserProfileStore } from '@/store/userProfileStore';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { playSound } from '@/lib/sounds';
import { SoundEffect } from '@/lib/sounds';

export function SyncButton() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const { syncNow, getStatus, lastSyncAt, isSyncing, error, pendingCount } = useSyncStore();
  const { getCurrentUser } = useAuthStore();
  const { reloadSessions } = useSessionStore();
  const { loadProfile } = useUserProfileStore();

  // 定期更新同步状态
  useEffect(() => {
    if (isAuthenticated) {
      getStatus();
      // 每 30 秒更新一次状态
      const interval = setInterval(getStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, getStatus]);

  if (!isAuthenticated) {
    return null; // 未登录不显示同步按钮
  }

  const handleSync = async () => {
    try {
      await syncNow();
      playSound(SoundEffect.SUCCESS);
      toast.success(t('sync.success'), {
        description: t('sync.successDescription'),
      });

      // 同步成功后重新加载会话和用户资料
      try {
        await Promise.all([
          reloadSessions(),
          getCurrentUser(),
          loadProfile(),
        ]);
      } catch (reloadError) {
        console.error('Failed to reload data after sync:', reloadError);
      }
    } catch (error) {
      playSound(SoundEffect.ERROR);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(t('sync.failed'), {
        description: errorMessage,
      });
      console.error('Sync failed:', error);
    }
  };

  // 计算最后同步时间的显示
  const formatLastSync = () => {
    if (!lastSyncAt) return t('sync.neverSynced');
    const now = Date.now() / 1000;
    const diff = Math.floor((now - lastSyncAt) / 60); // 分钟

    if (diff < 1) return t('sync.justNow');
    if (diff < 60) return t('sync.minutesAgo', { count: diff });
    const hours = Math.floor(diff / 60);
    if (hours < 24) return t('sync.hoursAgo', { count: hours });
    const days = Math.floor(hours / 24);
    return t('sync.daysAgo', { count: days });
  };

  const getStatusIcon = () => {
    if (isSyncing) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    if (error) {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }
    if (lastSyncAt) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  const getTooltipText = () => {
    if (isSyncing) return t('sync.syncing');
    if (error) return t('sync.syncFailed');
    return t('sync.lastSync', { time: formatLastSync() });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 relative"
      onClick={handleSync}
      disabled={isSyncing}
      title={getTooltipText()}
    >
      {getStatusIcon()}
      {pendingCount > 0 && (
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-white text-xs rounded-full flex items-center justify-center">
          {pendingCount > 9 ? '9+' : pendingCount}
        </span>
      )}
    </Button>
  );
}
