import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useScreenshot } from '@/hooks/useScreenshot';
import { Download, Image, Merge, Grid } from 'lucide-react';

/**
 * 截图演示组件
 * 展示如何使用截图功能捕获各个界面
 */
export function ScreenshotDemo() {
  const {
    isCapturing,
    error,
    captureSelector,
    captureMultipleSelectors,
    mergeVertical,
    mergeGrid,
    download,
  } = useScreenshot();

  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [mergedImage, setMergedImage] = useState<string | null>(null);

  // 定义要捕获的界面选择器
  const interfaceSelectors = [
    '#terminal-page',      // 终端页面
    '#sessions-page',      // 会话管理页面
    '#sftp-page',          // SFTP 文件管理页面
    '#settings-page',      // 设置页面
  ];

  /**
   * 捕获单个界面
   */
  const handleCaptureSingle = async (selector: string, name: string) => {
    const dataUrl = await captureSelector(selector, { scale: 2 });
    if (dataUrl) {
      // 下载单个截图
      download(dataUrl, `${name}-screenshot.png`);
    }
  };

  /**
   * 捕获所有界面
   */
  const handleCaptureAll = async () => {
    const images = await captureMultipleSelectors(interfaceSelectors, { scale: 2 });
    setCapturedImages(images);
  };

  /**
   * 合并为垂直布局
   */
  const handleMergeVertical = async () => {
    if (capturedImages.length === 0) {
      alert('请先捕获界面');
      return;
    }

    const merged = await mergeVertical(capturedImages, 20, '#ffffff');
    if (merged) {
      setMergedImage(merged);
      download(merged, 'all-interfaces-vertical.png');
    }
  };

  /**
   * 合并为网格布局
   */
  const handleMergeGrid = async () => {
    if (capturedImages.length === 0) {
      alert('请先捕获界面');
      return;
    }

    const merged = await mergeGrid(capturedImages, 2, 20, '#ffffff');
    if (merged) {
      setMergedImage(merged);
      download(merged, 'all-interfaces-grid.png');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          界面截图工具
        </CardTitle>
        <CardDescription>
          捕获各个界面为 SVG 矢量图，支持无损缩放和合并
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 单个界面截图 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">单个界面截图</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCaptureSingle('#terminal-page', 'terminal')}
              disabled={isCapturing}
            >
              <Download className="h-4 w-4 mr-2" />
              终端页面
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCaptureSingle('#sessions-page', 'sessions')}
              disabled={isCapturing}
            >
              <Download className="h-4 w-4 mr-2" />
              会话管理
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCaptureSingle('#sftp-page', 'sftp')}
              disabled={isCapturing}
            >
              <Download className="h-4 w-4 mr-2" />
              SFTP 管理
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCaptureSingle('#settings-page', 'settings')}
              disabled={isCapturing}
            >
              <Download className="h-4 w-4 mr-2" />
              设置页面
            </Button>
          </div>
        </div>

        {/* 批量截图 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">批量操作</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleCaptureAll}
              disabled={isCapturing}
              className="flex-1"
            >
              <Image className="h-4 w-4 mr-2" />
              {isCapturing ? '捕获中...' : '捕获所有界面'}
            </Button>
            <Button
              onClick={handleMergeVertical}
              disabled={isCapturing || capturedImages.length === 0}
              variant="secondary"
              className="flex-1"
            >
              <Merge className="h-4 w-4 mr-2" />
              垂直合并
            </Button>
            <Button
              onClick={handleMergeGrid}
              disabled={isCapturing || capturedImages.length === 0}
              variant="secondary"
              className="flex-1"
            >
              <Grid className="h-4 w-4 mr-2" />
              网格合并
            </Button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
            错误: {error}
          </div>
        )}

        {/* 预览 */}
        {capturedImages.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">预览 ({capturedImages.length} 个界面)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {capturedImages.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`Screenshot ${index + 1}`}
                    className="w-full h-auto border rounded-md"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => download(img, `screenshot-${index + 1}.png`)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 合并后的图片 */}
        {mergedImage && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">合并结果</h3>
            <div className="border rounded-md p-2 bg-muted/20">
              <img
                src={mergedImage}
                alt="Merged screenshot"
                className="w-full h-auto"
              />
            </div>
            <Button
              onClick={() => download(mergedImage, 'merged-screenshot.png')}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              下载合并后的图片
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
