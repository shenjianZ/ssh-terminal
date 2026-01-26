import { useEffect, useRef, useState } from 'react';
import { useScreenshot } from '@/hooks/useScreenshot';
import { Button } from '@/components/ui/button';
import { Camera, Grid } from 'lucide-react';

/**
 * 页面截图按钮组件
 * 可以添加到任何页面，用于快速截图当前页面
 */
interface PageScreenshotButtonProps {
  /** 页面名称（用于文件名） */
  pageName: string;
  /** 要捕获的选择器（默认捕获整个页面） */
  selector?: string;
  /** 缩放比例（默认2，获得更清晰的图片） */
  scale?: number;
  /** 是否显示按钮文本 */
  showText?: boolean;
}

export function PageScreenshotButton({
  pageName,
  selector,
  scale = 2,
  showText = true,
}: PageScreenshotButtonProps) {
  const { isCapturing, captureSelector, capturePage, download } = useScreenshot();

  const handleCapture = async () => {
    let dataUrl: string | null = null;

    if (selector) {
      dataUrl = await captureSelector(selector, { scale });
    } else {
      dataUrl = await capturePage({ scale });
    }

    if (dataUrl) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      download(dataUrl, `${pageName}-screenshot-${timestamp}.png`);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCapture}
      disabled={isCapturing}
      className="gap-2"
    >
      <Camera className={`h-4 w-4 ${isCapturing ? 'animate-pulse' : ''}`} />
      {showText && (isCapturing ? '截图中...' : '截图')}
    </Button>
  );
}

/**
 * 自动页面截图组件
 * 自动在页面加载完成后截图
 */
interface AutoPageScreenshotProps {
  /** 是否启用 */
  enabled?: boolean;
  /** 延迟时间（毫秒） */
  delay?: number;
  /** 页面名称 */
  pageName: string;
  /** 截图完成回调 */
  onCapture?: (dataUrl: string) => void;
}

export function AutoPageScreenshot({
  enabled = false,
  delay = 1000,
  pageName,
  onCapture,
}: AutoPageScreenshotProps) {
  const { capturePage } = useScreenshot();
  const hasCapturedRef = useRef(false);

  useEffect(() => {
    if (!enabled || hasCapturedRef.current) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const dataUrl = await capturePage({ scale: 2 });
        if (dataUrl) {
          hasCapturedRef.current = true;
          onCapture?.(dataUrl);
        }
      } catch (error) {
        console.error('Auto screenshot failed:', error);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [enabled, delay, pageName, onCapture, capturePage]);

  return null; // 这是一个无UI组件
}

/**
 * 批量界面截图合并工具
 * 用于在文档生成、演示制作等场景
 */
export function BatchScreenshotMerger() {
  const {
    isCapturing,
    captureMultipleSelectors,
    mergeVertical,
    mergeGrid,
    download,
  } = useScreenshot();

  const [status, setStatus] = useState<'idle' | 'capturing' | 'merging' | 'done'>('idle');

  /**
   * 执行批量截图和合并
   */
  const executeBatchCapture = async (
    selectors: string[],
    layout: 'vertical' | 'grid' = 'vertical',
    columns: number = 2
  ) => {
    setStatus('capturing');

    try {
      // 1. 捕获所有界面
      const images = await captureMultipleSelectors(selectors, { scale: 2 });
      if (images.length === 0) {
        throw new Error('No images captured');
      }

      setStatus('merging');

      // 2. 合并图片
      let merged: string | null = null;
      if (layout === 'vertical') {
        merged = await mergeVertical(images, 20, '#ffffff');
      } else {
        merged = await mergeGrid(images, columns, 20, '#ffffff');
      }

      if (!merged) {
        throw new Error('Failed to merge images');
      }

      // 3. 下载
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      download(merged, `batch-screenshot-${layout}-${timestamp}.png`);

      setStatus('done');

      // 3秒后重置状态
      setTimeout(() => setStatus('idle'), 3000);

      return merged;
    } catch (error) {
      console.error('Batch capture failed:', error);
      setStatus('idle');
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={() => executeBatchCapture([
            '#terminal-page',
            '#sessions-page',
            '#sftp-page',
            '#settings-page',
          ], 'vertical')}
          disabled={isCapturing || status !== 'idle'}
        >
          <Camera className={`h-4 w-4 mr-2 ${status === 'capturing' || status === 'merging' ? 'animate-pulse' : ''}`} />
          垂直合并所有界面
        </Button>

        <Button
          onClick={() => executeBatchCapture([
            '#terminal-page',
            '#sessions-page',
            '#sftp-page',
            '#settings-page',
          ], 'grid', 2)}
          disabled={isCapturing || status !== 'idle'}
          variant="secondary"
        >
          <Grid className={`h-4 w-4 mr-2 ${status === 'capturing' || status === 'merging' ? 'animate-pulse' : ''}`} />
          网格合并所有界面
        </Button>
      </div>

      {status !== 'idle' && (
        <div className="text-sm text-muted-foreground">
          {status === 'capturing' && '正在捕获界面...'}
          {status === 'merging' && '正在合并图片...'}
          {status === 'done' && '✓ 完成！'}
        </div>
      )}
    </div>
  );
}
