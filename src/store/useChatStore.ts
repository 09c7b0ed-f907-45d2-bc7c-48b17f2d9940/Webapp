import { create } from 'zustand';
import type { VisualizationResponseDTO } from '@/models/dto/response';

interface ChatStore {
  visualization: VisualizationResponseDTO | null;
  setVisualization: (v: VisualizationResponseDTO | null) => void;
  history: VisualizationResponseDTO[];
  addToHistory: (v: VisualizationResponseDTO) => void;

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