'use client';

import { useEffect, useRef } from "react";
import { useChatStore } from "@/store/useChatStore";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { CustomGraphPayload } from "@/store/useChatStore";
import clsx from "clsx";

export default function HistoryWindow() {
  const history = useChatStore((s) => s.history);
  const setVisualization = useChatStore((s) => s.setVisualization);
  const setSelectedChartIndex = useChatStore((s) => s.setSelectedChartIndex);
  const selectedChartIndex = useChatStore((s) => s.selectedChartIndex);
  const visualization = useChatStore((s) => s.visualization);

  const chartRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll into view when a chart is selected
  useEffect(() => {
    if (selectedChartIndex !== null && visualization) {
      const historyIndex = history.findIndex((h) => h === visualization);
      const refKey = `${historyIndex}-${selectedChartIndex}`;
      const ref = chartRefs.current.find((el) => el?.dataset.refkey === refKey);
      if (ref) {
        ref.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      }
    }
  }, [selectedChartIndex, visualization, history]);

  const handleClick = (viz: CustomGraphPayload, chartIndex: number) => {
    setVisualization(viz);
    setSelectedChartIndex(chartIndex);
  };

  return (
    <Carousel className="w-full h-full overflow-y-hidden">
      <CarouselContent className="h-full">
        {history.map((viz, historyIndex) =>
          viz.charts.map((chart, chartIndex) => {
            const refKey = `${historyIndex}-${chartIndex}`;
            const isSelected =
              visualization === viz && selectedChartIndex === chartIndex;

            return (
              <CarouselItem
                key={refKey}
                className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 min-w-0"
              >
                <div
                  ref={(el) => {
                    if (el) {
                      el.dataset.refkey = refKey;
                      chartRefs.current.push(el);
                    }
                  }}
                  onClick={() => handleClick(viz, chartIndex)}
                  className={clsx(
                    "cursor-pointer transition-all duration-300",
                    isSelected ? "ring-2 ring-blue-500 scale-[1.02]" : "hover:ring-1 hover:ring-muted"
                  )}
                >
                  <Card>
                    <CardContent className="p-4 text-sm">
                      <div className="font-semibold truncate">{chart.chartTitle}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {chart.sourceMetricId}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            );
          })
        )}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
