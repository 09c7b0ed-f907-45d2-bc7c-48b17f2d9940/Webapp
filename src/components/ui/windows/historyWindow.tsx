'use client';

import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/store/useChatStore";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { ChartDTO } from "@/models/dto/charts";
import type { VisualizationResponseDTO } from "@/models/dto/response";
import clsx from "clsx";
import { useTranslation } from 'react-i18next';
import '@/i18n';

export default function HistoryWindow() {
  const history = useChatStore((s) => s.history);
  const setVisualization = useChatStore((s) => s.setVisualization);
  const setSelectedChartIndex = useChatStore((s) => s.setSelectedChartIndex);
  const selectedChartIndex = useChatStore((s) => s.selectedChartIndex);
  const visualization = useChatStore((s) => s.visualization);
  const { t } = useTranslation('common');

  // Debug fallback data for visual testing when `history` is empty
  const debugHistory: VisualizationResponseDTO[] = [
    {
      charts: [
        { metadata: { title: 'Sample Bar Chart' }, type: 'BAR' } as any,
      ],
    } as any,
    {
      charts: [
        { metadata: { title: 'Sample Line Chart' }, type: 'LINE' } as any,
      ],
    } as any,
    {
      charts: [
        { metadata: { title: 'Sample Pie Chart' }, type: 'PIE' } as any,
      ],
    } as any,
    {
      charts: [
        { metadata: { title: 'Sample Box Chart' }, type: 'BOX' } as any,
      ],
    } as any,
    {
      charts: [
        { metadata: { title: 'Sample Bar Chart' }, type: 'BAR' } as any,
      ],
    } as any,
    {
      charts: [
        { metadata: { title: 'Sample Line Chart' }, type: 'LINE' } as any,
      ],
    } as any,
    {
      charts: [
        { metadata: { title: 'Sample Pie Chart' }, type: 'PIE' } as any,
      ],
    } as any,
    {
      charts: [
        { metadata: { title: 'Sample Box Chart' }, type: 'BOX' } as any,
      ],
    } as any,
  ];

  const displayHistory = (history && history.length > 0) ? history : debugHistory;

  const chartRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (selectedChartIndex !== null && visualization) {
      const historyIndex = displayHistory.findIndex((h) => h === visualization);
      const refKey = `${historyIndex}-${selectedChartIndex}`;
      const ref = chartRefs.current.find((el) => el?.dataset.refkey === refKey);
      if (ref) {
        ref.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      }
    }
  }, [selectedChartIndex, visualization, displayHistory]);

  const handleClick = (viz: VisualizationResponseDTO, chartIndex: number) => {
    setVisualization(viz);
    setSelectedChartIndex(chartIndex);
  };

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cardsPerView, setCardsPerView] = useState(1);

  useEffect(() => {
    const updateCardsPerView = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (height > 0) {
          setCardsPerView(Math.max(1, Math.floor(width / height)));
        }
      }
    };

    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(updateCardsPerView);
      resizeObserver.observe(containerRef.current);
    }
    updateCardsPerView();

    window.addEventListener("resize", updateCardsPerView);

    return () => {
      window.removeEventListener("resize", updateCardsPerView);
      if (resizeObserver && containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col justify-center">
      <Carousel className="flex-1 w-full h-full" opts={{ slidesToScroll: cardsPerView }}>
        <CarouselContent className="h-full">
          {displayHistory.map((viz, historyIndex) => {
            const charts = (viz.charts ?? []) as ChartDTO[];
            return charts.map((item, chartIndex) => {
              const refKey = `${historyIndex}-${chartIndex}`;
              const isSelected =
                visualization === viz && selectedChartIndex === chartIndex;

              return (
                <CarouselItem
                  key={refKey}
                  style={{
                    flex: `0 0 ${100 / cardsPerView}%`,
                    maxWidth: `${100 / cardsPerView}%`,
                    aspectRatio: "1 / 1",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  className="min-w-0"
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
                      "cursor-pointer transition-all duration-300 w-full h-full",
                      isSelected ? "ring-2 ring-blue-500 scale-[1.02]" : "hover:ring-1 hover:ring-muted"
                    )}
                    style={{ height: "100%", aspectRatio: "1 / 1", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Card className="w-full h-full flex flex-col justify-center">
                      <CardContent className="p-4 text-sm flex flex-col justify-center h-full">
                        <div className="font-semibold truncate">{(item as any).metadata?.title ?? ''}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {item.type === "BOX" && t('visualization.type.box')}
                          {item.type === "LINE" && t('visualization.type.line')}
                          {item.type === "AREA" && t('visualization.type.area')}
                          {item.type === "BAR" && t('visualization.type.bar')}
                          {item.type === "PIE" && t('visualization.type.pie')}
                          {item.type === "RADAR" && t('visualization.type.radar')}
                          {item.type !== "BOX" && item.type !== "LINE" && item.type !== "AREA" && item.type !== "BAR" && item.type !== "PIE" && item.type !== "RADAR" && (<>{item.type}</>)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              );
            });
          })}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
