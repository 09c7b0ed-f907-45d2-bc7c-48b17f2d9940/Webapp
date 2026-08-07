'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, SkipForward } from 'lucide-react';
import type { StatisticalTestResultDTO } from '@/models/dto/response';

interface MannWhitneyUThumbnailProps {
  result: StatisticalTestResultDTO;
}

export function MannWhitneyUThumbnail({ result }: MannWhitneyUThumbnailProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };

    const observedElement = containerRef.current;
    let resizeObserver: ResizeObserver | null = null;
    if (observedElement) {
      resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(observedElement);
    }
    updateDimensions();

    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (resizeObserver && observedElement) {
        resizeObserver.unobserve(observedElement);
      }
    };
  }, []);

  const compact = containerSize.width < 100 || containerSize.height < 150;
  const minimal = containerSize.width < 100 || containerSize.height < 50;

  if (result.status === 'skipped') {
    return (
      <div ref={containerRef} className="flex h-full w-full items-center justify-center rounded-lg p-3">
        <div className="flex flex-col items-center gap-2 text-center">
          <SkipForward className="h-5 w-5 text-yellow-600" />
          <div className="text-xs font-semibold">Skipped</div>
        </div>
      </div>
    );
  }

  if (result.status === 'error') {
    return (
      <div ref={containerRef} className="flex h-full w-full items-center justify-center rounded-lg p-3 text-red-900">
        <div className="flex flex-col items-center gap-2 text-center">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div className="text-xs font-semibold">Error</div>
        </div>
      </div>
    );
  }

  const passed = result.passed === true;
  const significanceLabel =
    result.status === 'success' ? (passed ? 'Significant' : 'Not significant') : result.status;
  const StatusIcon = passed ? CheckCircle2 : AlertCircle;
  const statusIconClassName = passed ? 'text-green-600' : 'text-red-600/50';

  return (
    <div ref={containerRef} className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-lg p-3 text-center">
      <div className={compact ? 'flex items-center gap-1.5 text-sm font-bold text-foreground' : 'text-lg font-bold text-foreground flex items-center gap-1'}>
        <StatusIcon className={compact ? `h-4 w-4 shrink-0 ${statusIconClassName}` : `h-5 w-5 shrink-0 ${statusIconClassName}`} />
        <span>p = {result.p_value?.toFixed(3) || 'N/A'}</span>
      </div>
      {!minimal ? (
        <div className="rounded-full border bg-muted/40 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
          {significanceLabel}
        </div>
      ) : null}
    </div>
  );
}