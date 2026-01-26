import { elementToSVG } from 'dom-to-svg';

/**
 * 截图配置
 */
export interface ScreenshotConfig {
  /** 是否包含外部样式（如字体） */
  includeStyles?: boolean;
  /** 图片质量（1-100） */
  quality?: number;
  /** 缩放比例（默认1，可以设置更高以获得更清晰的图片） */
  scale?: number;
}

/**
 * 将 DOM 元素转换为 SVG 矢量图
 * @param element DOM 元素
 * @param config 配置选项
 * @returns SVG 字符串
 */
export async function captureElementAsSvg(
  element: HTMLElement,
  _config: ScreenshotConfig = {}
): Promise<string> {
  try {
    // 使用 dom-to-svg 转换
    const svgDoc = elementToSVG(element);

    // 将 XMLDocument 转换为字符串
    const svgString = new XMLSerializer().serializeToString(svgDoc);
    return svgString;
  } catch (error) {
    console.error('Failed to capture element as SVG:', error);
    throw new Error(`SVG capture failed: ${error}`);
  }
}

/**
 * 将 SVG 转换为 PNG 图片
 * @param svgString SVG 字符串
 * @param width 图片宽度
 * @param height 图片高度
 * @param scale 缩放比例（默认1）
 * @returns PNG 数据 URL
 */
export async function svgToPng(
  svgString: string,
  width: number,
  height: number,
  scale: number = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    // 设置 canvas 尺寸（考虑缩放）
    canvas.width = width * scale;
    canvas.height = height * scale;

    // 创建 Blob URL
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      // 绘制图片到 canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 释放 URL
      URL.revokeObjectURL(url);

      // 转换为 PNG 数据 URL
      const pngDataUrl = canvas.toDataURL('image/png', 1.0);
      resolve(pngDataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG image'));
    };

    img.src = url;
  });
}

/**
 * 捕获元素并转换为 PNG
 * @param element DOM 元素
 * @param config 配置选项
 * @returns PNG 数据 URL
 */
export async function captureElementAsPng(
  element: HTMLElement,
  config: ScreenshotConfig = {}
): Promise<string> {
  const { scale = 2 } = config; // 默认使用 2 倍缩放以获得更清晰的图片

  // 1. 获取 SVG
  const svgString = await captureElementAsSvg(element, config);

  // 2. 获取元素尺寸
  const rect = element.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  // 3. 转换为 PNG
  const pngDataUrl = await svgToPng(svgString, width, height, scale);

  return pngDataUrl;
}

/**
 * 合并多个图片为一张图片（垂直排列）
 * @param images 图片数据 URL 数组
 * @param gap 图片之间的间距（像素）
 * @param backgroundColor 背景色
 * @returns 合并后的图片数据 URL
 */
export async function mergeImagesVertical(
  images: string[],
  gap: number = 20,
  backgroundColor: string = '#ffffff'
): Promise<string> {
  if (images.length === 0) {
    throw new Error('No images to merge');
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    // 加载所有图片
    const loadPromises = images.map((dataUrl) => {
      return new Promise<HTMLImageElement>((resolveImg, rejectImg) => {
        const img = new Image();
        img.onload = () => resolveImg(img);
        img.onerror = () => rejectImg(new Error('Failed to load image'));
        img.src = dataUrl;
      });
    });

    Promise.all(loadPromises)
      .then((loadedImages) => {
        // 计算总尺寸
        const maxWidth = Math.max(...loadedImages.map((img) => img.width));
        const totalHeight = loadedImages.reduce((sum, img) => sum + img.height, 0) +
                           gap * (loadedImages.length - 1);

        // 设置 canvas 尺寸
        canvas.width = maxWidth;
        canvas.height = totalHeight;

        // 填充背景色
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制所有图片
        let currentY = 0;
        loadedImages.forEach((img) => {
          ctx.drawImage(img, 0, currentY);
          currentY += img.height + gap;
        });

        // 转换为数据 URL
        const mergedDataUrl = canvas.toDataURL('image/png', 1.0);
        resolve(mergedDataUrl);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

/**
 * 合并多个图片为一张图片（水平排列）
 * @param images 图片数据 URL 数组
 * @param gap 图片之间的间距（像素）
 * @param backgroundColor 背景色
 * @returns 合并后的图片数据 URL
 */
export async function mergeImagesHorizontal(
  images: string[],
  gap: number = 20,
  backgroundColor: string = '#ffffff'
): Promise<string> {
  if (images.length === 0) {
    throw new Error('No images to merge');
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    // 加载所有图片
    const loadPromises = images.map((dataUrl) => {
      return new Promise<HTMLImageElement>((resolveImg, rejectImg) => {
        const img = new Image();
        img.onload = () => resolveImg(img);
        img.onerror = () => rejectImg(new Error('Failed to load image'));
        img.src = dataUrl;
      });
    });

    Promise.all(loadPromises)
      .then((loadedImages) => {
        // 计算总尺寸
        const maxHeight = Math.max(...loadedImages.map((img) => img.height));
        const totalWidth = loadedImages.reduce((sum, img) => sum + img.width, 0) +
                          gap * (loadedImages.length - 1);

        // 设置 canvas 尺寸
        canvas.width = totalWidth;
        canvas.height = maxHeight;

        // 填充背景色
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制所有图片
        let currentX = 0;
        loadedImages.forEach((img) => {
          ctx.drawImage(img, currentX, 0);
          currentX += img.width + gap;
        });

        // 转换为数据 URL
        const mergedDataUrl = canvas.toDataURL('image/png', 1.0);
        resolve(mergedDataUrl);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

/**
 * 合并多个图片为网格布局
 * @param images 图片数据 URL 数组
 * @param columns 列数
 * @param gap 图片之间的间距（像素）
 * @param backgroundColor 背景色
 * @returns 合并后的图片数据 URL
 */
export async function mergeImagesGrid(
  images: string[],
  columns: number,
  gap: number = 20,
  backgroundColor: string = '#ffffff'
): Promise<string> {
  if (images.length === 0) {
    throw new Error('No images to merge');
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    // 加载所有图片
    const loadPromises = images.map((dataUrl) => {
      return new Promise<HTMLImageElement>((resolveImg, rejectImg) => {
        const img = new Image();
        img.onload = () => resolveImg(img);
        img.onerror = () => rejectImg(new Error('Failed to load image'));
        img.src = dataUrl;
      });
    });

    Promise.all(loadPromises)
      .then((loadedImages) => {
        // 计算网格尺寸
        const rows = Math.ceil(loadedImages.length / columns);
        const columnWidths: number[] = new Array(columns).fill(0);
        const rowHeights: number[] = new Array(rows).fill(0);

        // 计算每列最大宽度和每行最大高度
        loadedImages.forEach((img, index) => {
          const col = index % columns;
          const row = Math.floor(index / columns);
          columnWidths[col] = Math.max(columnWidths[col], img.width);
          rowHeights[row] = Math.max(rowHeights[row], img.height);
        });

        const totalWidth = columnWidths.reduce((sum, w) => sum + w, 0) + gap * (columns - 1);
        const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0) + gap * (rows - 1);

        // 设置 canvas 尺寸
        canvas.width = totalWidth;
        canvas.height = totalHeight;

        // 填充背景色
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制所有图片
        let currentX = 0;
        let currentY = 0;

        loadedImages.forEach((img, index) => {
          const col = index % columns;
          const row = Math.floor(index / columns);

          // 计算当前位置
          const x = columnWidths.slice(0, col).reduce((sum, w) => sum + w, 0) + gap * col;
          const y = rowHeights.slice(0, row).reduce((sum, h) => sum + h, 0) + gap * row;

          ctx.drawImage(img, x, y);

          // 更新当前位置（换行）
          if (col === columns - 1) {
            currentY += rowHeights[row] + gap;
            currentX = 0;
          } else {
            currentX += columnWidths[col] + gap;
          }
        });

        // 转换为数据 URL
        const mergedDataUrl = canvas.toDataURL('image/png', 1.0);
        resolve(mergedDataUrl);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

/**
 * 下载图片
 * @param dataUrl 图片数据 URL
 * @param filename 文件名
 */
export function downloadImage(dataUrl: string, filename: string = 'screenshot.png'): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

/**
 * 下载 SVG 文件
 * @param svgString SVG 字符串
 * @param filename 文件名
 */
export function downloadSvg(svgString: string, filename: string = 'screenshot.svg'): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * 捕获整个页面
 * @param config 配置选项
 * @returns PNG 数据 URL
 */
export async function capturePageAsPng(config: ScreenshotConfig = {}): Promise<string> {
  const body = document.body;
  if (!body) {
    throw new Error('Cannot find body element');
  }
  return captureElementAsPng(body, config);
}

/**
 * 捕获指定选择器的元素
 * @param selector CSS 选择器
 * @param config 配置选项
 * @returns PNG 数据 URL
 */
export async function captureSelectorAsPng(
  selector: string,
  config: ScreenshotConfig = {}
): Promise<string> {
  const element = document.querySelector(selector) as HTMLElement;
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  return captureElementAsPng(element, config);
}

/**
 * 批量捕获多个选择器的元素
 * @param selectors CSS 选择器数组
 * @param config 配置选项
 * @returns PNG 数据 URL 数组
 */
export async function captureSelectorsAsPng(
  selectors: string[],
  config: ScreenshotConfig = {}
): Promise<string[]> {
  const results: string[] = [];

  for (const selector of selectors) {
    try {
      const pngDataUrl = await captureSelectorAsPng(selector, config);
      results.push(pngDataUrl);
    } catch (error) {
      console.error(`Failed to capture selector ${selector}:`, error);
      // 添加空白图片占位
      results.push(createPlaceholderImage(selector));
    }
  }

  return results;
}

/**
 * 创建占位图片（用于捕获失败时）
 * @param text 文本
 * @returns PNG 数据 URL
 */
function createPlaceholderImage(text: string): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  canvas.width = 800;
  canvas.height = 600;

  // 填充背景
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 绘制边框
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // 绘制文本
  ctx.fillStyle = '#999';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Failed to capture: ${text}`, canvas.width / 2, canvas.height / 2);

  return canvas.toDataURL('image/png');
}
