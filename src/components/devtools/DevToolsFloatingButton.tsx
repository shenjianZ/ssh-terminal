import { Button } from '@/components/ui/button';
import { ScanEye } from 'lucide-react';
import { useDevToolsStore } from '@/store/devtoolsStore';

export function DevToolsFloatingButton() {
  const { toggleElementSelector } = useDevToolsStore();

  return (
    <Button
      onClick={toggleElementSelector}
      size="icon"
      className="fixed bottom-4 right-4 z-[9997] h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all"
      title="DOM to SVG - 选择元素导出为 SVG"
      data-devtools-floating-button
    >
      <ScanEye className="h-5 w-5" />
    </Button>
  );
}
