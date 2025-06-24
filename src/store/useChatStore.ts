import { create } from 'zustand';
import type { PlotCollection } from '@/models/chartModels';

// Use PlotCollection for visualization and history
export type CustomGraphPayload = PlotCollection;

interface ChatStore {
  visualization: CustomGraphPayload | null;
  setVisualization: (v: CustomGraphPayload | null) => void;
  history: CustomGraphPayload[];
  addToHistory: (v: CustomGraphPayload) => void;

  selectedChartIndex: number | null;
  setSelectedChartIndex: (i: number) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  visualization: null,
  setVisualization: (v) => set({ visualization: v }),
  history: [],
  addToHistory: (v) => set((state) => ({ history: [v, ...state.history] })),
  selectedChartIndex: null,
  setSelectedChartIndex: (i) => set({ selectedChartIndex: i }),
}));