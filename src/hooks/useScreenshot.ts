import { useState } from 'react';
import {
  captureElementAsPng,
  captureElementAsSvg,
  capturePageAsPng,
  captureSelectorAsPng,
  captureSelectorsAsPng,
  mergeImagesVertical,
  mergeImagesHorizontal,
  mergeImagesGrid,
  downloadImage,
  downloadSvg,
  type ScreenshotConfig,
} from '@/lib/screenshot';

/**
 * 截图 Hook
 */
export function useScreenshot() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 捕获元素为 PNG
   */
  const captureAsPng = async (
    element: HTMLElement,
    config?: ScreenshotConfig
  ): Promise<string | null> => {
    setIsCapturing(true);
    setError(null);

    try {
      const pngDataUrl = await captureElementAsPng(element, config);
      return pngDataUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to capture as PNG:', err);
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * 捕获元素为 SVG
   */
  const captureAsSvg = async (
    element: HTMLElement,
    config?: ScreenshotConfig
  ): Promise<string | null> => {
    setIsCapturing(true);
    setError(null);

    try {
      const svgString = await captureElementAsSvg(element, config);
      return svgString;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to capture as SVG:', err);
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * 捕获选择器为 PNG
   */
  const captureSelector = async (
    selector: string,
    config?: ScreenshotConfig
  ): Promise<string | null> => {
    setIsCapturing(true);
    setError(null);

    try {
      const pngDataUrl = await captureSelectorAsPng(selector, config);
      return pngDataUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to capture selector:', err);
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * 批量捕获多个选择器
   */
  const captureMultipleSelectors = async (
    selectors: string[],
    config?: ScreenshotConfig
  ): Promise<string[]> => {
    setIsCapturing(true);
    setError(null);

    try {
      const pngDataUrls = await captureSelectorsAsPng(selectors, config);
      return pngDataUrls;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to capture multiple selectors:', err);
      return [];
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * 捕获整个页面
   */
  const capturePage = async (
    config?: ScreenshotConfig
  ): Promise<string | null> => {
    setIsCapturing(true);
    setError(null);

    try {
      const pngDataUrl = await capturePageAsPng(config);
      return pngDataUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to capture page:', err);
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * 合并图片（垂直）
   */
  const mergeVertical = async (
    images: string[],
    gap?: number,
    backgroundColor?: string
  ): Promise<string | null> => {
    setIsCapturing(true);
    setError(null);

    try {
      const merged = await mergeImagesVertical(images, gap, backgroundColor);
      return merged;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to merge images:', err);
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * 合并图片（水平）
   */
  const mergeHorizontal = async (
    images: string[],
    gap?: number,
    backgroundColor?: string
  ): Promise<string | null> => {
    setIsCapturing(true);
    setError(null);

    try {
      const merged = await mergeImagesHorizontal(images, gap, backgroundColor);
      return merged;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to merge images:', err);
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * 合并图片（网格）
   */
  const mergeGrid = async (
    images: string[],
    columns: number,
    gap?: number,
    backgroundColor?: string
  ): Promise<string | null> => {
    setIsCapturing(true);
    setError(null);

    try {
      const merged = await mergeImagesGrid(images, columns, gap, backgroundColor);
      return merged;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to merge images:', err);
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * 下载图片
   */
  const download = (dataUrl: string, filename?: string) => {
    try {
      downloadImage(dataUrl, filename);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to download image:', err);
    }
  };

  /**
   * 下载 SVG
   */
  const downloadSvgFile = (svgString: string, filename?: string) => {
    try {
      downloadSvg(svgString, filename);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to download SVG:', err);
    }
  };

  return {
    isCapturing,
    error,
    captureAsPng,
    captureAsSvg,
    captureSelector,
    captureMultipleSelectors,
    capturePage,
    mergeVertical,
    mergeHorizontal,
    mergeGrid,
    download,
    downloadSvgFile,
  };
}
