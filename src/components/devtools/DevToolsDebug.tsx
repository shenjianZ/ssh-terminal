import { useDevToolsStore } from '@/store/devtoolsStore';

export function DevToolsDebug() {
  const { isElementSelectorOpen } = useDevToolsStore();
  
  return (
    <div className="fixed top-4 left-4 z-[10002] bg-yellow-100 dark:bg-yellow-900 p-2 rounded text-xs font-mono">
      <div>ElementSelector: {isElementSelectorOpen ? 'OPEN' : 'CLOSED'}</div>
      <div>Environment: {import.meta.env.DEV ? 'DEV' : 'PROD'}</div>
    </div>
  );
}
