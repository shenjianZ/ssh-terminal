import { create } from 'zustand';

interface DevToolsState {
  isElementSelectorOpen: boolean;
  openElementSelector: () => void;
  closeElementSelector: () => void;
  toggleElementSelector: () => void;
}

export const useDevToolsStore = create<DevToolsState>((set) => ({
  isElementSelectorOpen: false,
  openElementSelector: () => set({ isElementSelectorOpen: true }),
  closeElementSelector: () => set({ isElementSelectorOpen: false }),
  toggleElementSelector: () => set((state) => ({ isElementSelectorOpen: !state.isElementSelectorOpen })),
}));
