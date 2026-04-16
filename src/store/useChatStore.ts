import { create } from 'zustand';
import type {
  VisualizationPlanMessageDTO,
  VisualizationResponseDTO,
} from '@/models/dto/response';

interface ChatStore {
  visualization: VisualizationResponseDTO | null;
  setVisualization: (v: VisualizationResponseDTO | null) => void;
  history: VisualizationResponseDTO[];
  addToHistory: (v: VisualizationResponseDTO) => void;
  visualizationPlans: Record<string, VisualizationPlanMessageDTO>;
  rememberVisualizationPlan: (traceId: string, plan: VisualizationPlanMessageDTO) => void;

  selectedChartIndex: number | null;
  setSelectedChartIndex: (i: number) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  visualization: null,
  setVisualization: (v) => set({ visualization: v }),
  history: [],
  addToHistory: (v) => set((state) => ({ history: [v, ...state.history] })),
  visualizationPlans: {},
  rememberVisualizationPlan: (traceId, plan) =>
    set((state) => ({
      visualizationPlans: {
        ...state.visualizationPlans,
        [traceId]: plan,
      },
    })),
  selectedChartIndex: null,
  setSelectedChartIndex: (i) => set({ selectedChartIndex: i }),
}));