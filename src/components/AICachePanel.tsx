/**
 * AI 缓存管理面板 - React 组件
 *
 * 提供可视化的缓存管理界面
 */

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Database,
  RefreshCw,
  Zap,
  Trash2,
  Info,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import './AICachePanel.css';

// ==================== 类型定义 ====================

interface CacheInfo {
  cache_size: number;
  cached_providers: string[];
}

interface HotReloadResult {
  success: boolean;
  removedCount: number;
  message: string;
}

// ==================== 工具函数 ====================

/**
 * 播放提示音
 */
function playSound(type: 'success' | 'error' | 'info') {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // 不同类型的声音频率
    const frequencies = {
      success: [800, 1000], // 高频成功音
      error: [300, 200],    // 低频错误音
      info: [600, 700]      // 中频提示音
    };

    const [startFreq, endFreq] = frequencies[type];

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(startFreq, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      endFreq,
      audioContext.currentTime + 0.1
    );

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    // 静默失败，不影响用户体验
    console.debug('Failed to play sound:', error);
  }
}

// ==================== 组件定义 ====================

/**
 * AI 缓存管理面板组件
 *
 * 功能：
 * - 显示缓存统计信息
 * - 列出所有缓存的 Provider
 * - 手动清除缓存（带确认对话框）
 * - 触发热重载
 * - 实时监控缓存状态
 * - 声音反馈
 * - Toast 消息提示
 */
export function AICachePanel() {
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  // 加载缓存信息
  const loadCacheInfo = async () => {
    try {
      setLoading(true);
      const info = await invoke<CacheInfo>('ai_get_cache_info');
      setCacheInfo(info);
    } catch (error) {
      console.error('Failed to load cache info:', error);
      toast.error('加载缓存信息失败', {
        description: String(error),
        icon: <XCircle className="h-4 w-4" />
      });
    } finally {
      setLoading(false);
    }
  };

  // 清除缓存
  const handleClearCache = async () => {
    setShowClearDialog(false);

    try {
      setLoading(true);
      await invoke('ai_clear_cache');
      await loadCacheInfo();

      playSound('success');
      toast.success('缓存已清除', {
        description: '所有 AI Provider 缓存已被清空',
        icon: <CheckCircle2 className="h-4 w-4" />
      });
    } catch (error) {
      console.error('Failed to clear cache:', error);

      playSound('error');
      toast.error('清除缓存失败', {
        description: String(error),
        icon: <XCircle className="h-4 w-4" />
      });
    } finally {
      setLoading(false);
    }
  };

  // 触发热重载
  const handleHotReload = async () => {
    try {
      setLoading(true);
      const result = await invoke<HotReloadResult>('ai_hot_reload');
      await loadCacheInfo();

      if (result.success) {
        playSound('success');
        toast.success('热重载成功', {
          description: `${result.message}（移除 ${result.removedCount} 个 Provider）`,
          icon: <CheckCircle2 className="h-4 w-4" />
        });
      } else {
        playSound('info');
        toast.info('热重载完成', {
          description: result.message,
          icon: <AlertCircle className="h-4 w-4" />
        });
      }
    } catch (error) {
      console.error('Failed to hot reload:', error);

      playSound('error');
      toast.error('热重载失败', {
        description: String(error),
        icon: <XCircle className="h-4 w-4" />
      });
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载缓存信息
  useEffect(() => {
    loadCacheInfo();

    // 每 5 秒自动刷新缓存信息
    const interval = setInterval(loadCacheInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="ai-cache-panel">
        <div className="ai-cache-panel__header">
          <div className="header-title">
            <Database className="title-icon" />
            <h2>AI Provider 缓存管理</h2>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={loadCacheInfo}
            disabled={loading}
            title="刷新缓存信息"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="ml-2">刷新</span>
          </Button>
        </div>

        {/* 缓存统计 */}
        <div className="ai-cache-panel__stats">
          <div className="stat-card">
            <div className="stat-card__icon">
              <Database className="h-5 w-5" />
            </div>
            <div className="stat-card__content">
              <div className="stat-card__label">缓存数量</div>
              <div className="stat-card__value">{cacheInfo?.cache_size ?? 0}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon">
              <Zap className="h-5 w-5" />
            </div>
            <div className="stat-card__content">
              <div className="stat-card__label">状态</div>
              <div className="stat-card__value">
                {cacheInfo && cacheInfo.cache_size > 0 ? (
                  <span className="status-active">活跃</span>
                ) : (
                  <span className="status-empty">空闲</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 缓存的 Provider 列表 */}
        <div className="ai-cache-panel__providers">
          <h3>已缓存的 Provider</h3>
          {!cacheInfo ? (
            <div className="empty-state">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <p>加载中...</p>
            </div>
          ) : cacheInfo.cached_providers.length > 0 ? (
            <ul className="provider-list">
              {cacheInfo.cached_providers.map((providerKey, index) => (
                <li key={index} className="provider-item">
                  <Database className="provider-icon" />
                  <code title={providerKey}>
                    {providerKey.length > 60 ? `${providerKey.substring(0, 60)}...` : providerKey}
                  </code>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <Database className="h-8 w-8" />
              <p>暂无缓存的 Provider</p>
              <p className="empty-state__hint">使用 AI 功能后会自动创建缓存</p>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="ai-cache-panel__actions">
          <Button
            className="btn-reload"
            onClick={handleHotReload}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            热重载
          </Button>
          <Button
            className="btn-clear"
            variant="destructive"
            onClick={() => setShowClearDialog(true)}
            disabled={loading || !cacheInfo || cacheInfo.cache_size === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            清除缓存
          </Button>
        </div>

        {/* 使用说明 */}
        <div className="ai-cache-panel__info">
          <div className="info-header">
            <Info className="h-4 w-4" />
            <span>使用说明</span>
          </div>
          <ul className="info-list">
            <li>
              <strong>缓存机制</strong>：相同的 AI 配置会自动复用，提升性能约 90%
            </li>
            <li>
              <strong>热重载</strong>：配置文件被外部修改时使用，智能清理变更的 Provider
            </li>
            <li>
              <strong>清除缓存</strong>：配置发生重大变更或遇到问题时使用
            </li>
            <li>
              <strong>自动管理</strong>：保存配置时会自动智能清理相关缓存
            </li>
          </ul>
        </div>
      </div>

      {/* 清除缓存确认对话框 */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              确认清除缓存
            </AlertDialogTitle>
            <AlertDialogDescription>
              此操作将清除所有 AI Provider 缓存。清除后，下次 AI 调用时会重新创建缓存。
              <br /><br />
              是否继续？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearCache}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认清除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * 简化版缓存指示器组件
 *
 * 用于在状态栏或工具栏中显示缓存状态
 */
export function AICacheIndicator() {
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    const updateCacheSize = async () => {
      try {
        const info = await invoke<CacheInfo>('ai_get_cache_info');
        setCacheSize(info.cache_size);
      } catch (error) {
        console.error('Failed to load cache info:', error);
      }
    };

    updateCacheSize();
    const interval = setInterval(updateCacheSize, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="ai-cache-indicator"
      title={`AI 缓存: ${cacheSize} 个 Provider${cacheSize > 0 ? '\n已启用缓存加速' : '\n暂无缓存'}`}
    >
      <Database className="h-4 w-4" />
      {cacheSize > 0 && (
        <span className="indicator-badge">{cacheSize}</span>
      )}
    </div>
  );
}

export default AICachePanel;
