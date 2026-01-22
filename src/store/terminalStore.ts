import { create } from 'zustand';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import { WebglAddon } from '@xterm/addon-webgl';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

export interface TerminalTab {
  id: string;
  // 每个标签页对应一个 connectionId（SSH 连接实例的 ID）
  // 每个 connectionId 对应一个 SSH 连接实例和一个 sessionId（会话配置 ID）
  connectionId: string;
  title: string;
  isActive: boolean;
  isDirty: boolean;
}

interface TerminalInstance {
  terminal: Terminal;
  containerElement: HTMLElement | null;
  fitAddon?: FitAddon;
  searchAddon?: SearchAddon;
  webglAddon?: WebglAddon;
  onDataHandler?: (data: string) => void; // 存储当前的 onData 处理器
  onDataDisposable?: { dispose: () => void }; // 存储 onData 监听器的 disposable 对象
  onDataListenerActive?: boolean; // 标记 onData 监听器是否已激活（用于防止重复设置）
  outputUnlisten?: UnlistenFn; // 存储输出监听器的 unlisten 函数
  onHostKeyDetect?: (host: string, fingerprint: string, keyType: string) => void; // 主机密钥检测回调
  outputListenerActive?: boolean; // 标记输出监听器是否已激活
}

interface TerminalStore {
  tabs: TerminalTab[];
  // 存储每个 connectionId 对应的终端实例
  // 注意：虽然参数名是 sessionId，但实际存储的是 connectionId
  terminalInstances: Map<string, TerminalInstance>;

  // 标签页操作
  addTab: (connectionId: string, title: string) => string;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabTitle: (tabId: string, title: string) => void;
  clearTabs: () => void;

  // 查询
  getActiveTab: () => TerminalTab | undefined;
  getTabsByConnection: (connectionId: string) => TerminalTab[];

  // 终端实例管理
  getTerminalInstance: (connectionId: string) => TerminalInstance | undefined;
  setTerminalInstance: (connectionId: string, instance: TerminalInstance) => void;
  removeTerminalInstance: (connectionId: string) => void;

  // 输出监听器管理
  setupOutputListener: (connectionId: string) => void;
  cleanupOutputListener: (connectionId: string) => void;

  // onData 监听器管理
  setupOnDataListener: (connectionId: string) => void;
  cleanupOnDataListener: (connectionId: string) => void;
}

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  tabs: [],
  terminalInstances: new Map(),

  addTab: (connectionId, title) => {
    const id = crypto.randomUUID();
    set((state) => ({
      tabs: [
        ...state.tabs.map((t) => ({ ...t, isActive: false })),
        {
          id,
          connectionId,
          title,
          isActive: true,
          isDirty: false,
        },
      ],
    }));
    return id;
  },

  removeTab: (tabId) => {
    const removedTab = get().tabs.find((t) => t.id === tabId);
    const isActive = removedTab?.isActive;

    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== tabId);

      // 如果移除的是活动标签页，激活最后一个标签页
      if (isActive && newTabs.length > 0) {
        newTabs[newTabs.length - 1].isActive = true;
      }

      return { tabs: newTabs };
    });

    // 检查该连接是否还有其他标签页
    if (removedTab) {
      const remainingTabs = get().getTabsByConnection(removedTab.connectionId);
      if (remainingTabs.length === 0) {
        // 没有其他标签页了，销毁终端实例并触发断开连接事件
        get().removeTerminalInstance(removedTab.connectionId);
        const event = new CustomEvent('tab-closed-for-session', {
          detail: { connectionId: removedTab.connectionId }
        });
        window.dispatchEvent(event);
      }
    }
  },

  setActiveTab: (tabId) => {
    set((state) => ({
      tabs: state.tabs.map((t) => ({
        ...t,
        isActive: t.id === tabId,
      })),
    }));
  },

  updateTabTitle: (tabId, title) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, title } : t)),
    }));
  },

  clearTabs: () => {
    set({ tabs: [] });
  },

  getActiveTab: () => {
    return get().tabs.find((t) => t.isActive);
  },

  getTabsByConnection: (connectionId) => {
    return get().tabs.filter((t) => t.connectionId === connectionId);
  },

  getTerminalInstance: (connectionId) => {
    return get().terminalInstances.get(connectionId);
  },

  setTerminalInstance: (connectionId, instance) => {
    const newInstances = new Map(get().terminalInstances);
    newInstances.set(connectionId, instance);
    set({ terminalInstances: newInstances });
  },

  removeTerminalInstance: (connectionId) => {
    const instance = get().terminalInstances.get(connectionId);
    if (instance) {
      // 先清理输出监听器
      get().cleanupOutputListener(connectionId);

      // 清理 onData 监听器
      get().cleanupOnDataListener(connectionId);

      try {
        // 销毁终端实例
        instance.terminal.dispose();
      } catch (e) {
        console.warn('[TerminalStore] Error disposing terminal:', e);
      }
      const newInstances = new Map(get().terminalInstances);
      newInstances.delete(connectionId);
      set({ terminalInstances: newInstances });
    }
  },

  // 设置输出监听器（持久化，不依赖组件生命周期）
  setupOutputListener: (connectionId) => {
    const instance = get().terminalInstances.get(connectionId);
    if (!instance) {
      console.warn(`[TerminalStore] No terminal instance found for connection: ${connectionId}`);
      return;
    }

    // 检查监听器是否已经设置（避免重复设置）
    if (instance.outputListenerActive) {
      console.log(`[TerminalStore] Output listener already active for: ${connectionId}, skipping...`);
      return;
    }

    const eventName = `ssh-output-${connectionId}`;
    console.log(`[TerminalStore] Setting up persistent listener for: ${eventName}`);

    // 用于检测主机密钥的缓冲区（在监听器外部声明，保持状态）
    let outputBuffer = '';
    let dialogShown = false;

    // 设置监听器
    listen<number[]>(eventName, (event) => {
      const data = new Uint8Array(event.payload);
      const text = new TextDecoder().decode(data);

      // 从 store 获取最新的终端实例
      const currentInstance = get().terminalInstances.get(connectionId);
      if (currentInstance?.terminal) {
        currentInstance.terminal.write(data);
        console.log(`[TerminalStore] Received ${data.length} bytes for ${connectionId}: ${text.substring(0, 50)}...`);

        // 更新缓冲区用于检测
        outputBuffer += text;
        if (outputBuffer.length > 2000) {
          outputBuffer = outputBuffer.slice(-2000);
        }

        // 检测主机密钥确认提示（使用缓冲区检测）
        if (!dialogShown && currentInstance.onHostKeyDetect &&
            outputBuffer.includes("The authenticity of host") &&
            outputBuffer.includes("can't be established")) {
          // 提取主机信息
          const hostMatch = outputBuffer.match(/The authenticity of host '([^']+)'/);
          const fingerprintMatch = outputBuffer.match(/fingerprint is (SHA256:[^\s]+)/);
          const keyTypeMatch = outputBuffer.match(/(ED25519|RSA|ECDSA) key fingerprint/);

          if (hostMatch && fingerprintMatch && keyTypeMatch) {
            dialogShown = true;
            currentInstance.onHostKeyDetect(hostMatch[1], fingerprintMatch[1], keyTypeMatch[1]);
          }
        }
      } else {
        console.warn(`[TerminalStore] Terminal instance not found for ${connectionId}, dropping ${data.length} bytes`);
      }
    }).then((unlisten) => {
      // 保存 unlisten 函数到 store，并标记监听器已激活
      const updatedInstance = get().terminalInstances.get(connectionId);
      if (updatedInstance) {
        const newInstances = new Map(get().terminalInstances);
        newInstances.set(connectionId, {
          ...updatedInstance,
          outputUnlisten: unlisten,
          outputListenerActive: true,
        });
        set({ terminalInstances: newInstances });
        console.log(`[TerminalStore] Listener setup complete for: ${eventName}`);
      }
    }).catch((error) => {
      console.error(`[TerminalStore] Failed to setup listener for ${eventName}:`, error);
    });
  },

  // 清理输出监听器
  cleanupOutputListener: (connectionId) => {
    const instance = get().terminalInstances.get(connectionId);
    if (instance?.outputUnlisten) {
      console.log(`[TerminalStore] Cleaning up listener for: ${connectionId}`);
      instance.outputUnlisten();

      // 从 store 中移除 unlisten 引用，并标记监听器未激活
      const newInstances = new Map(get().terminalInstances);
      newInstances.set(connectionId, {
        ...instance,
        outputUnlisten: undefined,
        outputListenerActive: false,
      });
      set({ terminalInstances: newInstances });
    }
  },

  // 设置 onData 监听器（持久化，不依赖组件生命周期）
  setupOnDataListener: (connectionId) => {
    const instance = get().terminalInstances.get(connectionId);
    if (!instance) {
      console.warn(`[TerminalStore] No terminal instance found for connection: ${connectionId}`);
      return;
    }

    // 检查监听器是否已经激活（避免重复设置）
    if (instance.onDataListenerActive) {
      console.log(`[TerminalStore] onData listener already active for: ${connectionId}, skipping...`);
      return;
    }

    // 立即标记为激活（防止并发调用）
    const newInstances = new Map(get().terminalInstances);
    newInstances.set(connectionId, {
      ...instance,
      onDataListenerActive: true,
    });
    set({ terminalInstances: newInstances });

    const terminal = instance.terminal;
    if (!terminal) {
      console.warn(`[TerminalStore] Terminal not found for connection: ${connectionId}`);
      // 重置标志
      const resetInstances = new Map(get().terminalInstances);
      resetInstances.set(connectionId, {
        ...get().terminalInstances.get(connectionId)!,
        onDataListenerActive: false,
      });
      set({ terminalInstances: resetInstances });
      return;
    }

    console.log(`[TerminalStore] Setting up onData listener for: ${connectionId}`);

    // 创建 onData 处理器
    const onDataHandler = (data: string) => {
      // 从 store 获取最新的实例，确保 connectionId 没有变化
      const currentInstance = get().terminalInstances.get(connectionId);

      // 双重检查：确保终端实例和处理器仍然有效
      if (currentInstance?.terminal === terminal &&
          currentInstance?.onDataHandler === onDataHandler) {
        console.log(`[TerminalStore] Writing data to connection: ${connectionId}, length: ${data.length}, data: ${JSON.stringify(data)}`);
        invoke('ssh_write', {
          sessionId: connectionId,
          data: new TextEncoder().encode(data),
        }).catch((error) => {
          console.error(`[TerminalStore] Failed to write data to connection ${connectionId}:`, error);
        });
      } else {
        console.warn(`[TerminalStore] Terminal instance or handler mismatch, ignoring data for connection: ${connectionId}`);
      }
    };

    // 设置监听器（xterm.js 的 onData 返回 IDisposable）
    const disposable = terminal.onData(onDataHandler);

    // 保存处理器和 disposable 到 store
    const updatedInstances = new Map(get().terminalInstances);
    updatedInstances.set(connectionId, {
      ...instance,
      onDataHandler: onDataHandler,
      onDataDisposable: disposable,
      onDataListenerActive: true,
    });
    set({ terminalInstances: updatedInstances });

    console.log(`[TerminalStore] onData listener setup complete for: ${connectionId}`);
  },

  // 清理 onData 监听器
  cleanupOnDataListener: (connectionId) => {
    const instance = get().terminalInstances.get(connectionId);
    if (instance?.onDataDisposable) {
      console.log(`[TerminalStore] Cleaning up onData listener for: ${connectionId}`);

      try {
        instance.onDataDisposable.dispose();
      } catch (e) {
        console.warn('[TerminalStore] Error disposing onData listener:', e);
      }

      // 从 store 中移除监听器引用，并重置激活标志
      const newInstances = new Map(get().terminalInstances);
      newInstances.set(connectionId, {
        ...instance,
        onDataHandler: undefined,
        onDataDisposable: undefined,
        onDataListenerActive: false,
      });
      set({ terminalInstances: newInstances });
    }
  },
}));
