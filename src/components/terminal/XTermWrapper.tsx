import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { WebglAddon } from '@xterm/addon-webgl';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { useTerminalConfigStore } from '@/store/terminalConfigStore';
import { HostKeyConfirmDialog } from '@/components/ssh/HostKeyConfirmDialog';
import '@xterm/xterm/css/xterm.css';

interface XTermWrapperProps {
  sessionId: string;
  onData?: (data: string) => void;
  onTitleChange?: (title: string) => void;
}

export function XTermWrapper({ sessionId, onData, onTitleChange }: XTermWrapperProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalRefInstance = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const webglAddonRef = useRef<WebglAddon | null>(null);
  const isInitializedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  // 主机密钥确认对话框状态
  const [hostKeyDialog, setHostKeyDialog] = useState({
    open: false,
    host: '',
    fingerprint: '',
    keyType: '',
  });

  // 从 store 获取配置
  const { config, getCurrentTheme } = useTerminalConfigStore();
  const theme = getCurrentTheme();

  // 初始化终端（只执行一次）
  useEffect(() => {
    if (!terminalRef.current || isInitializedRef.current) return;

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

    // 标记终端已准备好
    setIsReady(true);

    // 处理用户输入
    terminal.onData((data) => {
      invoke('ssh_write', {
        sessionId,
        data: new TextEncoder().encode(data),
      });
      onData?.(data);
    });

    // 监听来自Rust的SSH输出
    let unlisten: UnlistenFn | null = null;
    let outputBuffer = '';
    let dialogShown = false; // 防止重复弹出对话框

    const setupOutputListener = async () => {
      try {
        const eventName = `ssh-output-${sessionId}`;
        unlisten = await listen<number[]>(
          eventName,
          (event) => {
            const data = new Uint8Array(event.payload);
            const text = new TextDecoder().decode(data);

            // 写入终端
            terminal.write(data);

            // 更新缓冲区用于检测
            outputBuffer += text;
            if (outputBuffer.length > 2000) {
              outputBuffer = outputBuffer.slice(-2000);
            }

            // 检测主机密钥确认提示（使用缓冲区检测）
            if (!dialogShown && outputBuffer.includes("The authenticity of host") && outputBuffer.includes("can't be established")) {
              // 提取主机信息
              const hostMatch = outputBuffer.match(/The authenticity of host '([^']+)'/);
              const fingerprintMatch = outputBuffer.match(/fingerprint is (SHA256:[^\s]+)/);
              const keyTypeMatch = outputBuffer.match(/(ED25519|RSA|ECDSA) key fingerprint/);

              if (hostMatch && fingerprintMatch && keyTypeMatch) {
                dialogShown = true;
                setHostKeyDialog({
                  open: true,
                  host: hostMatch[1],
                  fingerprint: fingerprintMatch[1],
                  keyType: keyTypeMatch[1],
                });
              }
            }
          }
        );
      } catch (error) {
        console.error('Failed to setup SSH output listener:', error);
      }
    };

    setupOutputListener();

    // 窗口大小调整（防抖处理）
    let resizeTimer: NodeJS.Timeout | null = null;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (fitAddonRef.current && terminalRefInstance.current) {
          fitAddonRef.current.fit();
          const { cols, rows } = terminalRefInstance.current;
          invoke('ssh_resize_pty', { sessionId, rows, cols }).catch(console.error);
        }
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    // 初始调整大小
    setTimeout(handleResize, 100);

    return () => {
      setIsReady(false);
      isInitializedRef.current = false;
      if (resizeTimer) clearTimeout(resizeTimer);
      if (unlisten) {
        unlisten();
      }
      window.removeEventListener('resize', handleResize);
      if (webglAddonRef.current) {
        webglAddonRef.current.dispose();
        webglAddonRef.current = null;
      }
      if (terminalRefInstance.current) {
        terminalRefInstance.current.dispose();
        terminalRefInstance.current = null;
      }
      if (fitAddonRef.current) {
        fitAddonRef.current = null;
      }
    };
  }, [sessionId]);

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
    terminal.options.fontSize = config.fontSize;
    terminal.options.fontFamily = config.fontFamily;
    terminal.options.fontWeight = config.fontWeight;
    terminal.options.lineHeight = config.lineHeight;
    terminal.options.letterSpacing = config.letterSpacing;

    // 刷新终端以应用更改
    try {
      terminal.refresh(0, terminal.rows - 1);
    } catch (e) {
      // 忽略刷新错误，主题已通过 options 更新
    }
  }, [config, theme, isReady]);

  // 使用动态样式，支持 padding
  return (
    <>
      <div
        ref={terminalRef}
        className="w-full h-full"
        style={{
          padding: `${config.padding}px`,
        }}
      />

      {/* 主机密钥确认对话框 */}
      <HostKeyConfirmDialog
        open={hostKeyDialog.open}
        onOpenChange={(open) => setHostKeyDialog({ ...hostKeyDialog, open })}
        host={hostKeyDialog.host}
        fingerprint={hostKeyDialog.fingerprint}
        keyType={hostKeyDialog.keyType}
        onConfirm={async () => {
          // 发送 "yes" 命令
          await invoke('ssh_write', {
            sessionId,
            data: new TextEncoder().encode('yes\n'),
          });
          setHostKeyDialog({ ...hostKeyDialog, open: false });
          // 重置标志，允许下次连接时再次检测
          dialogShown = false;
        }}
        onCancel={() => {
          setHostKeyDialog({ ...hostKeyDialog, open: false });
          // 重置标志
          dialogShown = false;
        }}
      />
    </>
  );
}
