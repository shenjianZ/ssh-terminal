import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { WebglAddon } from '@xterm/addon-webgl';
import { SearchAddon } from '@xterm/addon-search';
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { Sparkles, Copy, Clipboard, Search, Trash2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { useTerminalConfigStore } from '@/store/terminalConfigStore';
import { useTerminalStore } from '@/store/terminalStore';
import { useKeybindingStore } from '@/store/keybindingStore';
import { HostKeyConfirmDialog } from '@/components/ssh/HostKeyConfirmDialog';
import { NLToCommandDialog } from '@/components/ai/command/NLToCommandDialog';
import { ErrorAnalyzerDialog } from '@/components/ai/command/ErrorAnalyzerDialog';
import { CommandExplainerDialog } from '@/components/ai/command/CommandExplainerDialog';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from '@/components/ui/context-menu';
import { normalizeKeyCombo } from '@/lib/keybindingParser';
import { keybindingActionExecutor } from '@/lib/keybindingActions';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import '@xterm/xterm/css/xterm.css';

interface XTermWrapperProps {
  // 每个终端标签页对应一个 connectionId（SSH 连接实例的 ID）和一个 sessionId（会话配置 ID）
  connectionId: string;
}

export function XTermWrapper({ connectionId }: XTermWrapperProps) {
  const { t } = useTranslation();
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalRefInstance = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const webglAddonRef = useRef<WebglAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const isInitializedRef = useRef(false);
  const dialogShownRef = useRef(false);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentFontSizeRef = useRef<number | null>(null); // 使用 ref 存储当前字体大小，确保同步读取
  const [isReady, setIsReady] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [tempFontSize, setTempFontSize] = useState<number | null>(null); // 仅用于触发重新渲染
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // NL2CMD 对话框状态
  const [showNLToCmdDialog, setShowNLToCmdDialog] = useState(false);

  // 错误分析对话框状态
  const [showErrorAnalyzer, setShowErrorAnalyzer] = useState(false);
  const [errorText, setErrorText] = useState('');

  // 命令解释对话框状态
  const [showCommandExplainer, setShowCommandExplainer] = useState(false);
  const [commandText, setCommandText] = useState('');

  // 主机密钥确认对话框状态
  const [hostKeyDialog, setHostKeyDialog] = useState({
    open: false,
    host: '',
    fingerprint: '',
    keyType: '',
  });

  // 从 store 获取配置和终端实例
  const { config, getCurrentTheme } = useTerminalConfigStore();
  const { getTerminalInstance, setTerminalInstance, setupOutputListener, setupOnDataListener } = useTerminalStore();
  const theme = getCurrentTheme();

  /**
   * 在 xterm.js 内部的 textarea 上附加键盘事件拦截器
   * 这是最有效的拦截方式，可以直接阻止 xterm.js 的处理
   */
  const attachKeyInterceptor = (terminalElement: HTMLElement) => {
    // xterm.js 在内部创建一个 textarea 元素来接收键盘输入
    // 我们需要找到这个 textarea 并在上面添加捕获阶段的监听器
    setTimeout(() => {
      const textarea = terminalElement.querySelector('textarea');
      if (!textarea) {
        console.warn('[XTermWrapper] textarea not found in terminal element');
        console.log('[XTermWrapper] Terminal element children:', terminalElement.children.length);
        // 打印所有子元素
        Array.from(terminalElement.children).forEach((child, i) => {
          console.log(`[XTermWrapper] Child ${i}:`, child.tagName, child.className);
        });
        return;
      }

      // 检查是否已经添加过拦截器
      if ((textarea as any).__keyInterceptorAttached) {
        return;
      }

      // 添加捕获阶段的键盘事件监听器
      const keyInterceptor = async (event: KeyboardEvent) => {
        // 忽略只有修饰键的事件
        if (
          event.key === 'Control' ||
          event.key === 'Alt' ||
          event.key === 'Shift' ||
          event.key === 'Meta'
        ) {
          return;
        }

        // 标准化快捷键组合
        const keys = normalizeKeyCombo(event);

        // 从 store 中查找对应的动作ID
        const actionId = useKeybindingStore.getState().getActionByKeys(keys);

        // 如果没有找到对应的快捷键，不处理
        if (!actionId) {
          return;
        }

        // 特殊处理：粘贴 - 始终拦截并执行粘贴
        if (actionId === 'terminal.paste') {
          handlePaste();
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return;
        }

        // 特殊处理：查找 - 始终拦截并打开查找对话框
        if (actionId === 'terminal.find') {
          handleFind();
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return;
        }

        // 特殊处理：清屏 - 始终拦截并清屏
        if (actionId === 'terminal.clear') {
          handleClear();
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return;
        }

        // 特殊处理：放大/缩小字体 - 始终拦截并执行（使用上下文菜单相同的方法）
        if (actionId === 'terminal.zoomIn') {
          handleZoomIn();
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return;
        }

        if (actionId === 'terminal.zoomOut') {
          handleZoomOut();
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return;
        }

        if (actionId === 'terminal.zoomReset') {
          // 重置字体大小为配置文件的值
          currentFontSizeRef.current = null; // 清除 ref，让它回退到 config.fontSize
          setTempFontSize(null); // 清除 state
          if (terminalRefInstance.current) {
            terminalRefInstance.current.options.fontSize = config.fontSize; // 使用配置的字体大小
          }
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return;
        }

        // 其他快捷键使用全局执行器
        const executed = await keybindingActionExecutor.execute(actionId);
        if (executed) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
        }
      };

      // 添加键盘事件拦截器
      textarea.addEventListener('keydown', keyInterceptor, { capture: true, passive: false });

      // 标记已添加
      (textarea as any).__keyInterceptorAttached = true;
    }, 100);
  };

  // 初始化终端（从 store 获取或创建）
  useEffect(() => {
    if (!terminalRef.current) return;

    const currentConnectionId = connectionId;

    // 检查 store 中是否已有该 connectionId 的终端实例
    const existingInstance = getTerminalInstance(currentConnectionId);

    // 如果已有实例，复用它（无论是否初始化过）
    if (existingInstance && existingInstance.terminal) {
      const terminal = existingInstance.terminal;
      terminalRefInstance.current = terminal;

      // 从 store 中获取 addon 引用
      if (existingInstance.fitAddon) {
        fitAddonRef.current = existingInstance.fitAddon;
      }
      if (existingInstance.searchAddon) {
        searchAddonRef.current = existingInstance.searchAddon;
      }
      if (existingInstance.webglAddon) {
        webglAddonRef.current = existingInstance.webglAddon;
      }

      // 检查终端是否已经绑定到 DOM
      const terminalElement = (terminal as unknown as { element?: HTMLElement }).element;
      const currentContainer = terminalRef.current;

      // 如果终端已经打开且绑定到不同的容器，需要移动 DOM（不调用 open，避免清空内容）
      if (terminalElement && terminalElement.parentNode !== currentContainer) {
        // 检查当前容器是否为空，如果不为空说明有其他内容
        if (currentContainer.children.length > 0) {
          console.warn(`[XTermWrapper] Container for ${currentConnectionId} is not empty, clearing...`);
        }

        // 将终端元素移动到新容器（不调用 open，避免清空内容）
        currentContainer.innerHTML = '';
        currentContainer.appendChild(terminalElement);

        // 更新 store 中的容器引用
        setTerminalInstance(currentConnectionId, {
          ...existingInstance,
          containerElement: currentContainer,
        });

        // 重新调整大小
        if (existingInstance.fitAddon) {
          setTimeout(() => {
            existingInstance.fitAddon?.fit();
          }, 50);
        }

        // 添加键盘事件拦截器到 textarea
        attachKeyInterceptor(terminalElement);
      } else if (!terminalElement) {
        // 终端未打开（这种情况不应该发生，但为了安全）
        console.warn('[XTermWrapper] Terminal instance exists but not opened, reopening...');
        currentContainer.innerHTML = '';
        terminal.open(currentContainer);

        // 更新 store 中的容器引用
        setTerminalInstance(currentConnectionId, {
          ...existingInstance,
          containerElement: currentContainer,
        });

        // 添加键盘事件拦截器
        setTimeout(() => {
          const elem = (terminal as unknown as { element?: HTMLElement }).element;
          if (elem) attachKeyInterceptor(elem);
        }, 10);
      } else {
        // 终端已经绑定到正确的容器，只需要调整大小
        if (existingInstance.fitAddon) {
          setTimeout(() => {
            existingInstance.fitAddon?.fit();
          }, 50);
        }

        // 添加键盘事件拦截器（可能之前没有添加）
        attachKeyInterceptor(terminalElement);
      }

      // 重新设置事件监听器（确保使用正确的 connectionId）
      // 注意：xterm.js 的 onSelectionChange 和 onData 会替换之前的监听器
      terminal.onSelectionChange(() => {
        setHasSelection(terminal.hasSelection());
      });
      
      // 注意：onData 监听器会在单独的 useEffect 中统一设置（对所有实例），避免重复绑定
      
      setIsReady(true);
      isInitializedRef.current = true;

      // 终端复用完成后，延迟聚焦（确保 DOM 已经更新）
      setTimeout(() => {
        if (terminalRefInstance.current) {
          try {
            terminalRefInstance.current.focus();
            console.log(`[XTermWrapper] Auto-focused terminal for connection: ${currentConnectionId}`);
          } catch (e) {
            console.warn(`[XTermWrapper] Failed to auto-focus terminal:`, e);
          }
        }
      }, 100);

      // 更新主机密钥检测回调（如果还没有设置）
      if (!existingInstance.onHostKeyDetect) {
        setTerminalInstance(currentConnectionId, {
          ...existingInstance,
          onHostKeyDetect: (host, fingerprint, keyType) => {
            setHostKeyDialog({
              open: true,
              host,
              fingerprint,
              keyType,
            });
            dialogShownRef.current = true;
          },
        });
      }

      // 设置输出监听器和 onData 监听器（持久化，不依赖组件生命周期）
      // setupOutputListener 和 setupOnDataListener 内部会检查是否已有监听器，避免重复设置
      setupOutputListener(currentConnectionId);
      setupOnDataListener(currentConnectionId);

      // 注意：窗口大小调整会在后面统一设置（对所有实例）
    } else {
      // 创建新实例
      isInitializedRef.current = true;

      // 初始化终端
      const terminal = new Terminal({
      cursorBlink: config.cursorBlink,
      cursorStyle: config.cursorStyle,
      fontSize: config.fontSize,
      fontFamily: config.fontFamily,
      fontWeight: config.fontWeight,
      lineHeight: config.lineHeight,
      letterSpacing: config.letterSpacing,
      scrollback: config.scrollback,
      theme: {
        foreground: theme.foreground,
        background: theme.background,
        cursor: theme.cursor,
        cursorAccent: theme.cursorAccent,
        selectionBackground: theme.selectionBackground,
        black: theme.black,
        red: theme.red,
        green: theme.green,
        yellow: theme.yellow,
        blue: theme.blue,
        magenta: theme.magenta,
        cyan: theme.cyan,
        white: theme.white,
        brightBlack: theme.brightBlack,
        brightRed: theme.brightRed,
        brightGreen: theme.brightGreen,
        brightYellow: theme.brightYellow,
        brightBlue: theme.brightBlue,
        brightMagenta: theme.brightMagenta,
        brightCyan: theme.brightCyan,
        brightWhite: theme.brightWhite,
      },
      allowProposedApi: true,
      allowTransparency: false,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    terminal.open(terminalRef.current);

    // 添加键盘事件拦截器
    setTimeout(() => {
      const elem = (terminal as unknown as { element?: HTMLElement }).element;
      if (elem) {
        attachKeyInterceptor(elem);
      }
    }, 10);

    // 监听选中状态变化
    terminal.onSelectionChange(() => {
      setHasSelection(terminal.hasSelection());
    });

    // 加载搜索插件
    const searchAddon = new SearchAddon();
    terminal.loadAddon(searchAddon);
    searchAddonRef.current = searchAddon;

    // 尝试加载 WebGL 渲染器
    try {
      const webglAddon = new WebglAddon();
      webglAddon.onContextLoss(() => {
        webglAddonRef.current?.dispose();
        if (terminalRefInstance.current) {
          terminalRefInstance.current.loadAddon(new WebglAddon());
        }
      });
      terminal.loadAddon(webglAddon);
      webglAddonRef.current = webglAddon;
    } catch (e) {
      console.warn('WebGL addon failed to load, falling back to canvas renderer:', e);
    }

      terminalRefInstance.current = terminal;
      fitAddonRef.current = fitAddon;

      // 保存终端实例到 store（包括 addon 引用，使用 connectionId 作为键）
      setTerminalInstance(currentConnectionId, {
        terminal,
        containerElement: terminalRef.current,
        fitAddon,
        searchAddon,
        webglAddon: webglAddonRef.current || undefined,
        onHostKeyDetect: (host, fingerprint, keyType) => {
          setHostKeyDialog({
            open: true,
            host,
            fingerprint,
            keyType,
          });
          dialogShownRef.current = true;
        },
      });

      // 设置输出监听器和 onData 监听器（持久化，不依赖组件生命周期）
      setupOutputListener(currentConnectionId);
      setupOnDataListener(currentConnectionId);

      // 标记终端已准备好
      setIsReady(true);

      // 新终端创建完成后，延迟聚焦（确保 DOM 已经渲染）
      setTimeout(() => {
        if (terminalRefInstance.current) {
          try {
            terminalRefInstance.current.focus();
            console.log(`[XTermWrapper] Auto-focused new terminal for connection: ${currentConnectionId}`);
          } catch (e) {
            console.warn(`[XTermWrapper] Failed to auto-focus new terminal:`, e);
          }
        }
      }, 100);
    }

    // 注意：onData 监听器和输出监听器会在单独的 useEffect 中统一设置，避免重复绑定

    // 窗口大小调整（防抖处理）
    const handleResize = () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        if (fitAddonRef.current && terminalRefInstance.current) {
          fitAddonRef.current.fit();
          const { cols, rows } = terminalRefInstance.current;
          // 后端 API 使用 connectionId
          invoke('terminal_resize', { sessionId: currentConnectionId, rows, cols }).catch(console.error);
        }
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    // 初始调整大小
    setTimeout(handleResize, 100);

    return () => {
      setIsReady(false);
      // 关键：不要重置 isInitializedRef，这样下次复用实例时不会重新初始化
      // isInitializedRef.current = false;

      // 清理定时器
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
        resizeTimerRef.current = null;
      }

      // 注意：输出监听器会在独立的 useEffect 中清理，这里不需要清理
      window.removeEventListener('resize', handleResize);

      // 关键：不在这里销毁终端实例，也不调用 terminal.dispose()
      // 终端实例和 DOM 元素都保留，只是组件卸载
      // 只有当标签页被关闭时，store 才会销毁实例
    };
  }, [connectionId, config, theme, getTerminalInstance, setTerminalInstance]);

  // 动态更新主题和配置
  useEffect(() => {
    if (!terminalRefInstance.current || !isReady) return;

    const terminal = terminalRefInstance.current;

    // 更新终端主题
    terminal.options.theme = {
      foreground: theme.foreground,
      background: theme.background,
      cursor: theme.cursor,
      cursorAccent: theme.cursorAccent,
      selectionBackground: theme.selectionBackground,
      black: theme.black,
      red: theme.red,
      green: theme.green,
      yellow: theme.yellow,
      blue: theme.blue,
      magenta: theme.magenta,
      cyan: theme.cyan,
      white: theme.white,
      brightBlack: theme.brightBlack,
      brightRed: theme.brightRed,
      brightGreen: theme.brightGreen,
      brightYellow: theme.brightYellow,
      brightBlue: theme.brightBlue,
      brightMagenta: theme.brightMagenta,
      brightCyan: theme.brightCyan,
      brightWhite: theme.brightWhite,
    };

    // 更新其他配置
    terminal.options.cursorBlink = config.cursorBlink;
    terminal.options.cursorStyle = config.cursorStyle;
    // 字体大小：如果有临时的缩放大小，使用临时值；否则使用配置值
    const finalFontSize = tempFontSize || config.fontSize;
    terminal.options.fontSize = finalFontSize;
    // 同步 ref
    if (tempFontSize) {
      currentFontSizeRef.current = tempFontSize;
    } else {
      currentFontSizeRef.current = null;
    }
    terminal.options.fontFamily = config.fontFamily;
    terminal.options.fontWeight = config.fontWeight;
    terminal.options.lineHeight = config.lineHeight;
    terminal.options.letterSpacing = config.letterSpacing;

    // 刷新终端以应用更改
    try {
      terminal.refresh(0, terminal.rows - 1);
    } catch {
      // 忽略刷新错误，主题已通过 options 更新
    }
  }, [config, theme, isReady, tempFontSize]);

  // 监听 NL2CMD 触发事件
  useEffect(() => {
    const handleNLToCmdTrigger = (event: Event) => {
      const customEvent = event as CustomEvent<{ connectionId: string }>;
      if (customEvent.detail.connectionId === connectionId) {
        setShowNLToCmdDialog(true);
      }
    };

    window.addEventListener('terminal-nl2cmd-trigger', handleNLToCmdTrigger);

    return () => {
      window.removeEventListener('terminal-nl2cmd-trigger', handleNLToCmdTrigger);
    };
  }, [connectionId]);

  // 监听快捷键触发的 NL2CMD 事件
  useEffect(() => {
    const handleKeybindingNLToCmd = () => {
      // 检查当前是否有活跃的终端标签
      const activeTab = useTerminalStore.getState().getActiveTab();
      if (activeTab && activeTab.connectionId === connectionId) {
        setShowNLToCmdDialog(true);
      }
    };

    window.addEventListener('keybinding-terminal-open-nl2cmd', handleKeybindingNLToCmd);

    return () => {
      window.removeEventListener('keybinding-terminal-open-nl2cmd', handleKeybindingNLToCmd);
    };
  }, [connectionId]);

  // 监听快捷键触发的命令解释事件
  useEffect(() => {
    const handleKeybindingExplainCommand = () => {
      // 检查当前是否有活跃的终端标签
      const activeTab = useTerminalStore.getState().getActiveTab();
      if (activeTab && activeTab.connectionId === connectionId) {
        // 检查是否有选中的文本
        if (terminalRefInstance.current && terminalRefInstance.current.hasSelection()) {
          const selection = terminalRefInstance.current.getSelection();
          setCommandText(selection);
          setShowCommandExplainer(true);
        } else {
          toast.error('请先在终端中选中要解释的命令');
        }
      }
    };

    window.addEventListener('keybinding-terminal-explain-command', handleKeybindingExplainCommand);

    return () => {
      window.removeEventListener('keybinding-terminal-explain-command', handleKeybindingExplainCommand);
    };
  }, [connectionId]);

  // 监听快捷键触发的错误分析事件
  useEffect(() => {
    const handleKeybindingAnalyzeError = () => {
      // 检查当前是否有活跃的终端标签
      const activeTab = useTerminalStore.getState().getActiveTab();
      if (activeTab && activeTab.connectionId === connectionId) {
        // 检查是否有选中的文本
        if (terminalRefInstance.current && terminalRefInstance.current.hasSelection()) {
          const selection = terminalRefInstance.current.getSelection();
          setErrorText(selection);
          setShowErrorAnalyzer(true);
        } else {
          toast.error('请先在终端中选中要分析的错误信息');
        }
      }
    };

    window.addEventListener('keybinding-terminal-analyze-error', handleKeybindingAnalyzeError);

    return () => {
      window.removeEventListener('keybinding-terminal-analyze-error', handleKeybindingAnalyzeError);
    };
  }, [connectionId]);

  // 处理复制操作
  const handleCopy = async () => {
    if (terminalRefInstance.current && terminalRefInstance.current.hasSelection()) {
      const selection = terminalRefInstance.current.getSelection();
      try {
        await navigator.clipboard.writeText(selection);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  // 处理 AI 错误分析
  const handleErrorAnalyze = () => {
    if (terminalRefInstance.current && terminalRefInstance.current.hasSelection()) {
      const selection = terminalRefInstance.current.getSelection();
      setErrorText(selection);
      setShowErrorAnalyzer(true);
    }
  };

  // 处理粘贴操作
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && terminalRefInstance.current) {
        // 转换换行符：\n 或 \r\n -> \r
        // 终端使用 \r（回车符）作为换行
        const converted = text.replace(/\r\n/g, '\r').replace(/\n/g, '\r');

        await invoke('terminal_write', {
          sessionId: connectionId,
          data: new TextEncoder().encode(converted),
        });
      }
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  };

  // 清屏功能
  const handleClear = () => {
    if (terminalRefInstance.current) {
      terminalRefInstance.current.clear();
    }
  };

  // 重置终端功能
  const handleReset = () => {
    if (terminalRefInstance.current) {
      terminalRefInstance.current.reset();
    }
  };

  // 增大字号
  const handleZoomIn = () => {
    if (terminalRefInstance.current) {
      // 使用 ref 读取最新的字体大小，确保快速连按也能正确累加
      const currentSize = currentFontSizeRef.current || config.fontSize;
      const newSize = Math.min(currentSize + 2, 32);
      // 同步更新 ref
      currentFontSizeRef.current = newSize;
      // 更新 state 以触发重新渲染
      setTempFontSize(newSize);
      // 立即应用到终端
      terminalRefInstance.current.options.fontSize = newSize;
    }
  };

  // 减小字号
  const handleZoomOut = () => {
    if (terminalRefInstance.current) {
      // 使用 ref 读取最新的字体大小，确保快速连按也能正确累加
      const currentSize = currentFontSizeRef.current || config.fontSize;
      const newSize = Math.max(currentSize - 2, 8);
      // 同步更新 ref
      currentFontSizeRef.current = newSize;
      // 更新 state 以触发重新渲染
      setTempFontSize(newSize);
      // 立即应用到终端
      terminalRefInstance.current.options.fontSize = newSize;
    }
  };

  // 处理 NL2CMD 命令确认
  const handleNLToCmdConfirm = async (command: string) => {
    if (terminalRefInstance.current) {
      // 直接执行生成的命令（`#` 被拦截了，没有发送到终端）
      await invoke('terminal_write', {
        sessionId: connectionId,
        data: new TextEncoder().encode(command),
      });

      // 发送回车
      await invoke('terminal_write', {
        sessionId: connectionId,
        data: new TextEncoder().encode('\r'),
      });
    }
  };

  // 查找功能
  const handleFind = () => {
    setShowSearchDialog(true);
  };

  const handleSearchSubmit = () => {
    if (searchAddonRef.current && searchTerm) {
      searchAddonRef.current.findNext(searchTerm);
      setShowSearchDialog(false);
      setSearchTerm('');
    }
  };

  // 重启会话功能
  const handleRestartSession = async () => {
    try {
      // 先断开连接（使用 connectionId）
      await invoke('session_disconnect', { sessionId: connectionId }); // 后端 API 参数名是 sessionId，但值是 connectionId
      // 短暂延迟后重新连接
      // 注意：重新连接需要使用原始的 sessionId（会话配置 ID），而不是 connectionId
      // 这里需要从 session store 中获取对应的 sessionId
      setTimeout(async () => {
        // TODO: 需要从 session store 获取对应的 sessionId（会话配置 ID）
        // 当前实现假设使用 connectionId，可能需要调整
        await invoke('session_connect', { sessionId: connectionId });
      }, 500);
    } catch (err) {
      console.error('Failed to restart session:', err);
    }
  };

  // 导出日志功能
  const handleExportLog = async () => {
    if (terminalRefInstance.current) {
      try {
        const lines: string[] = [];
        for (let i = 0; i < terminalRefInstance.current.buffer.active.length; i++) {
          const line = terminalRefInstance.current.buffer.active.getLine(i);
          if (line) {
            lines.push(line.translateToString(true));
          }
        }
        const content = lines.join('\n');

        // 使用 Tauri 的文件对话框 API
        const filePath = await save({
          filters: [
            {
              name: 'Log Files',
              extensions: ['log', 'txt']
            }
          ],
          defaultPath: `terminal-log-${new Date().toISOString().slice(0, 10)}.log`
        });

        if (filePath) {
          await writeTextFile(filePath, content);
        }
      } catch (err) {
        console.error('Failed to export log:', err);
        // 如果 Tauri API 不可用，回退到浏览器方式
        try {
          const lines: string[] = [];
          for (let i = 0; i < terminalRefInstance.current.buffer.active.length; i++) {
            const line = terminalRefInstance.current.buffer.active.getLine(i);
            if (line) {
              lines.push(line.translateToString(true));
            }
          }
          const content = lines.join('\n');
          const blob = new Blob([content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `terminal-log-${new Date().toISOString().slice(0, 10)}.log`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (fallbackErr) {
          console.error('Fallback export also failed:', fallbackErr);
        }
      }
    }
  };

  // 使用动态样式，支持 padding
  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={terminalRef}
            className="w-full h-full"
            style={{
              padding: `${config.padding}px`,
            }}
          />
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem disabled={!hasSelection} onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" />
            {t('terminal.contextMenu.copy')}
          </ContextMenuItem>
          <ContextMenuItem onClick={handlePaste}>
            <Clipboard className="h-4 w-4 mr-2" />
            {t('terminal.contextMenu.paste')}
          </ContextMenuItem>
          <ContextMenuItem onClick={handleFind}>
            <Search className="h-4 w-4 mr-2" />
            {t('terminal.contextMenu.find')}
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem disabled={!hasSelection} onClick={handleErrorAnalyze} className="gap-2">
            <Sparkles className="h-4 w-4" />
            {t('terminal.contextMenu.analyzeError')}
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem onClick={handleClear}>
            <Trash2 className="h-4 w-4 mr-2" />
            {t('terminal.contextMenu.clear')}
          </ContextMenuItem>
          <ContextMenuItem onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('terminal.contextMenu.reset')}
          </ContextMenuItem>
          <ContextMenuItem onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4 mr-2" />
            {t('terminal.contextMenu.zoomIn')}
          </ContextMenuItem>
          <ContextMenuItem onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4 mr-2" />
            {t('terminal.contextMenu.zoomOut')}
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem onClick={handleRestartSession}>
            {t('terminal.contextMenu.restartSession')}
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem onClick={handleExportLog}>
            {t('terminal.contextMenu.exportLog')}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* 主机密钥确认对话框 */}
      <HostKeyConfirmDialog
        open={hostKeyDialog.open}
        onOpenChange={(open) => setHostKeyDialog({ ...hostKeyDialog, open })}
        host={hostKeyDialog.host}
        fingerprint={hostKeyDialog.fingerprint}
        keyType={hostKeyDialog.keyType}
        onConfirm={async () => {
          // 发送 "yes" 命令
          await invoke('terminal_write', {
            sessionId: connectionId, // 后端 API 参数名是 sessionId，但值是 connectionId
            data: new TextEncoder().encode('yes\n'),
          });
          setHostKeyDialog({ ...hostKeyDialog, open: false });
          // 重置标志，允许下次连接时再次检测
          dialogShownRef.current = false;
        }}
        onCancel={() => {
          setHostKeyDialog({ ...hostKeyDialog, open: false });
          // 重置标志
          dialogShownRef.current = false;
        }}
      />

      {/* NL2CMD 对话框 */}
      <NLToCommandDialog
        open={showNLToCmdDialog}
        onOpenChange={setShowNLToCmdDialog}
        onConfirm={handleNLToCmdConfirm}
        connectionId={connectionId}
      />

      {/* 错误分析对话框 */}
      <ErrorAnalyzerDialog
        open={showErrorAnalyzer}
        onOpenChange={setShowErrorAnalyzer}
        errorText={errorText}
      />

      {/* 命令解释对话框 */}
      <CommandExplainerDialog
        open={showCommandExplainer}
        onOpenChange={setShowCommandExplainer}
        command={commandText}
      />

      {/* 搜索对话框 */}
      {showSearchDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">查找文本</h3>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md mb-4"
              placeholder="请输入要查找的文本"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchSubmit();
                } else if (e.key === 'Escape') {
                  setShowSearchDialog(false);
                  setSearchTerm('');
                }
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 border rounded-md hover:bg-accent"
                onClick={() => {
                  setShowSearchDialog(false);
                  setSearchTerm('');
                }}
              >
                取消
              </button>
              <button
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                onClick={handleSearchSubmit}
                disabled={!searchTerm}
              >
                查找
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
