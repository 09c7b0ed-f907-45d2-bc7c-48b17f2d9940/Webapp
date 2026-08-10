'use client';

import { AlertCircle, CheckCircle2, SkipForward } from 'lucide-react';
import type { StatisticalTestResultDTO } from '@/models/dto/response';

interface MannWhitneyUThumbnailProps {
  result: StatisticalTestResultDTO;
}

export function MannWhitneyUThumbnail({ result }: MannWhitneyUThumbnailProps) {
  if (result.status === 'skipped') {
    return (
      <div className="flex h-full w-full min-h-0 min-w-0 items-center justify-center rounded-lg p-3">
        <div className="flex flex-col items-center gap-2 text-center">
          <SkipForward className="h-4 w-4 text-yellow-600" />
          <div className="text-[10px] font-semibold leading-tight">Skipped</div>
        </div>
      </div>
    );
  }

  if (result.status === 'error') {
    return (
      <div className="flex h-full w-full min-h-0 min-w-0 items-center justify-center rounded-lg p-3 text-red-900">
        <div className="flex flex-col items-center gap-2 text-center">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <div className="text-[10px] font-semibold leading-tight">Error</div>
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
    <div className="flex h-full w-full min-h-0 min-w-0 flex-col items-center justify-center gap-2 rounded-lg p-3 text-center">
      <div className="flex max-w-full items-center gap-1.5 text-sm font-bold leading-tight text-foreground">
        <StatusIcon className={`h-4 w-4 shrink-0 ${statusIconClassName}`} />
        <span>p = {result.p_value?.toFixed(3) || 'N/A'}</span>
      </div>
      <div className="max-w-full truncate rounded-full border bg-muted/40 px-2 py-0.5 text-[10px] font-medium leading-tight text-muted-foreground">
        {significanceLabel}
      </div>
    </div>
  );
}