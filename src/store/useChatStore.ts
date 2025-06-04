import { create } from 'zustand';

export type ChartData = {
  chartTitle: string;
  xAxisLabel: string;
  yAxisLabel: string;
  bins: number[];
  series: {
    label: string;
    values: number[];
  }[];
  grouped: boolean;
  sourceMetricId: string;
};

export type CustomGraphPayload = {
  charts: ChartData[];
};

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