import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, MousePointer2, X, Info } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { toast } from 'sonner';

interface ElementSelectorProps {
  onClose?: () => void;
}

export function ElementSelector({ onClose }: ElementSelectorProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const selectedHighlightRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // 获取元素的简短描述
  const getElementDescription = useCallback((element: HTMLElement): string => {
    let desc = element.tagName.toLowerCase();
    if (element.id) desc += `#${element.id}`;
    
    // 安全处理 className
    if (element.className) {
      try {
        // className 可能是 SVGAnimatedString 或其他类型
        const classNameStr = typeof element.className === 'string' 
          ? element.className 
          : element.className.toString();
        
        const classes = classNameStr.split(' ').filter(c => c.trim());
        if (classes.length > 0) {
          desc += `.${classes.slice(0, 3).join('.')}`;
          if (classes.length > 3) desc += '...';
        }
      } catch (e) {
        // 忽略 className 处理错误
        console.warn('[ElementSelector] Failed to process className:', e);
      }
    }
    return desc;
  }, []);

  // 更新已选择元素的高亮
  useEffect(() => {
    if (!selectedElement || !selectedHighlightRef.current) return;

    const updateHighlight = () => {
      if (!selectedElement || !selectedHighlightRef.current) return;
      const rect = selectedElement.getBoundingClientRect();
      selectedHighlightRef.current.style.display = 'block';
      selectedHighlightRef.current.style.left = `${rect.left + window.scrollX}px`;
      selectedHighlightRef.current.style.top = `${rect.top + window.scrollY}px`;
      selectedHighlightRef.current.style.width = `${rect.width}px`;
      selectedHighlightRef.current.style.height = `${rect.height}px`;
    };

    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight, true);

    return () => {
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight, true);
      if (selectedHighlightRef.current) {
        selectedHighlightRef.current.style.display = 'none';
      }
    };
  }, [selectedElement]);

  // 更新高亮显示
  const updateHighlight = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    
    if (highlightRef.current) {
      highlightRef.current.style.display = 'block';
      highlightRef.current.style.left = `${rect.left + window.scrollX}px`;
      highlightRef.current.style.top = `${rect.top + window.scrollY}px`;
      highlightRef.current.style.width = `${rect.width}px`;
      highlightRef.current.style.height = `${rect.height}px`;
    }

    if (tooltipRef.current) {
      tooltipRef.current.style.display = 'block';
      let tooltipTop = rect.top - 30;
      let tooltipLeft = rect.left;
      
      if (tooltipTop < 10) {
        tooltipTop = rect.bottom + 5;
      }
      if (tooltipLeft + 300 > window.innerWidth) {
        tooltipLeft = window.innerWidth - 310;
      }
      
      tooltipRef.current.style.top = `${tooltipTop}px`;
      tooltipRef.current.style.left = `${tooltipLeft}px`;
      tooltipRef.current.textContent = getElementDescription(element);
    }
  }, [getElementDescription]);

  // 选择模式的事件处理
  useEffect(() => {
    if (!isSelecting) {
      if (highlightRef.current) highlightRef.current.style.display = 'none';
      if (tooltipRef.current) tooltipRef.current.style.display = 'none';
      setHoveredElement(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      
      const element = document.elementFromPoint(x, y) as HTMLElement;
      if (!element) return;

      if (panelRef.current?.contains(element)) {
        if (highlightRef.current) highlightRef.current.style.display = 'none';
        if (tooltipRef.current) tooltipRef.current.style.display = 'none';
        setHoveredElement(null);
        return;
      }

      setHoveredElement(element);
      updateHighlight(element);
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (hoveredElement && !panelRef.current?.contains(hoveredElement)) {
        setSelectedElement(hoveredElement);
        setIsSelecting(false);
        return;
      }
      
      const x = e.clientX;
      const y = e.clientY;
      const element = document.elementFromPoint(x, y) as HTMLElement;
      
      if (!element) return;
      if (panelRef.current?.contains(element)) return;

      setSelectedElement(element);
      setIsSelecting(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSelecting(false);
      } else if (e.key === 'Enter' && hoveredElement) {
        e.preventDefault();
        if (!panelRef.current?.contains(hoveredElement)) {
          setSelectedElement(hoveredElement);
          setIsSelecting(false);
        }
      } else if (e.key === 'ArrowUp' && hoveredElement) {
        e.preventDefault();
        const parent = hoveredElement.parentElement;
        if (parent && !panelRef.current?.contains(parent)) {
          setHoveredElement(parent);
          updateHighlight(parent);
        }
      } else if (e.key === 'ArrowDown' && hoveredElement) {
        e.preventDefault();
        const firstChild = hoveredElement.children[0] as HTMLElement;
        if (firstChild && !panelRef.current?.contains(firstChild)) {
          setHoveredElement(firstChild);
          updateHighlight(firstChild);
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSelecting, hoveredElement, getElementDescription, updateHighlight]);

  const startSelecting = useCallback(() => {
    setSelectedElement(null);
    setIsSelecting(true);
  }, []);

  const exportToSVG = useCallback(async () => {
    if (!selectedElement) return;

    try {
      const devtoolsElements = Array.from(document.querySelectorAll('[data-devtools-ui]'));
      const floatingButton = document.querySelector('[data-devtools-floating-button]');
      
      const highZIndexElements = Array.from(document.querySelectorAll('[class*="z-[9"]')).filter(el => {
        const zIndex = window.getComputedStyle(el as HTMLElement).zIndex;
        return parseInt(zIndex) >= 9000;
      });
      
      const allElementsToRemove = new Set([...devtoolsElements, ...highZIndexElements]);
      if (floatingButton) allElementsToRemove.add(floatingButton);
      
      const elementPositions: { element: Element; parent: Node; nextSibling: Node | null }[] = [];
      
      allElementsToRemove.forEach((el) => {
        const parent = el.parentNode;
        const nextSibling = el.nextSibling;
        if (parent) {
          elementPositions.push({ element: el, parent, nextSibling });
          parent.removeChild(el);
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const svgDataUrl = await htmlToImage.toSvg(selectedElement, {
        cacheBust: true,
        pixelRatio: 2,
      });
      
      elementPositions.forEach(({ element, parent, nextSibling }) => {
        try {
          if (!document.contains(parent as Node)) {
            document.body.appendChild(element);
            return;
          }
          
          if (nextSibling && parent.contains(nextSibling)) {
            parent.insertBefore(element, nextSibling);
          } else {
            parent.appendChild(element);
          }
        } catch (err) {
          try {
            document.body.appendChild(element);
          } catch (e) {
            console.error('Failed to restore element:', e);
          }
        }
      });

      let svgContent: string;
      
      if (svgDataUrl.startsWith('data:image/svg+xml;base64,')) {
        svgContent = atob(svgDataUrl.split(',')[1]);
      } else if (svgDataUrl.startsWith('data:image/svg+xml;charset=utf-8,')) {
        svgContent = decodeURIComponent(svgDataUrl.split(',')[1]);
      } else if (svgDataUrl.startsWith('data:image/svg+xml,')) {
        svgContent = svgDataUrl.split(',')[1];
      } else {
        throw new Error('Unsupported SVG data format');
      }

      const filePath = await save({
        filters: [{
          name: 'SVG',
          extensions: ['svg']
        }],
        defaultPath: `element-${Date.now()}.svg`
      });

      if (filePath) {
        await writeTextFile(filePath, svgContent);
        setSelectedElement(null);
        toast.success('SVG 导出成功', {
          description: `文件已保存到: ${filePath}`
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('SVG 导出失败', {
        description: error instanceof Error ? error.message : String(error)
      });
    }
  }, [selectedElement]);

  return (
    <>
      {/* 半透明覆盖层 */}
      {isSelecting && (
        <div
          className="fixed inset-0 z-[9998] bg-black/20 pointer-events-none"
          style={{ cursor: 'crosshair' }}
          data-devtools-ui
        />
      )}

      {/* 悬停高亮框 */}
      <div
        ref={highlightRef}
        className="fixed z-[9999] pointer-events-none hidden"
        style={{
          border: '2px solid #3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.4)',
        }}
        data-devtools-ui
      />

      {/* 提示框 */}
      <div
        ref={tooltipRef}
        className="fixed z-[10001] pointer-events-none hidden px-3 py-1.5 bg-gray-900 text-white text-xs font-mono rounded shadow-lg"
        data-devtools-ui
      />

      {/* 已选择元素高亮 */}
      {selectedElement && (
        <div
          ref={selectedHighlightRef}
          className="fixed z-[9999] pointer-events-none hidden"
          style={{
            border: '3px solid #10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.5)',
          }}
          data-devtools-ui
        />
      )}

      {/* 控制面板 */}
      <div
        ref={panelRef}
        className="fixed bottom-20 right-4 z-[10000] bg-background border rounded-lg shadow-xl p-4 min-w-[320px] max-w-[400px]"
        data-devtools-ui
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h3 className="text-sm font-semibold">DOM to SVG</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <Button
            onClick={startSelecting}
            disabled={isSelecting}
            className="w-full"
            variant={isSelecting ? 'secondary' : 'default'}
          >
            <MousePointer2 className="h-4 w-4 mr-2" />
            {isSelecting ? '正在选择...' : '开始选择元素'}
          </Button>

          {isSelecting && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-xs">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-blue-800 dark:text-blue-200">
                <p className="font-medium">移动鼠标浏览元素</p>
                <p className="text-blue-600 dark:text-blue-300">↑ 父元素 • ↓ 子元素</p>
                <p className="text-blue-600 dark:text-blue-300">Enter / 点击确认 • ESC 取消</p>
              </div>
            </div>
          )}

          {selectedElement && !isSelecting && (
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg border">
                <p className="text-xs text-muted-foreground mb-2 font-medium">已选择元素:</p>
                <code className="block p-2 bg-background rounded text-xs break-all font-mono border">
                  {getElementDescription(selectedElement)}
                </code>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">尺寸:</span>
                    <span className="ml-1 font-mono">
                      {Math.round(selectedElement.getBoundingClientRect().width)} × {Math.round(selectedElement.getBoundingClientRect().height)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">标签:</span>
                    <span className="ml-1 font-mono">{selectedElement.tagName.toLowerCase()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={exportToSVG}
                  className="flex-1"
                  variant="default"
                >
                  <Download className="h-4 w-4 mr-2" />
                  导出 SVG
                </Button>
                <Button
                  onClick={() => setSelectedElement(null)}
                  variant="outline"
                  size="icon"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
