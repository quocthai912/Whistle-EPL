import { useEffect, useState } from 'react';
import { useSession } from '../../shared/http/use-session';
import type { RegulationVersionDetail } from './regulation-model';

export function useRegulationReviewContent(id: string | null | undefined) {
  const { client, epoch } = useSession();
  const [result, setResult] = useState<{
    id: string;
    epoch: number;
    detail?: RegulationVersionDetail;
    error?: string;
  }>();
  useEffect(() => {
    if (!id) return;
    let active = true;
    void client
      .request<RegulationVersionDetail>(`/regulation-versions/${encodeURIComponent(id)}`)
      .then(({ data }) => {
        if (active && data.id === id) setResult({ id, epoch, detail: data });
      })
      .catch((error: unknown) => {
        if (active)
          setResult({
            id,
            epoch,
            error: error instanceof Error ? error.message : 'Không thể tải nội dung quy định.',
          });
      });
    return () => {
      active = false;
    };
  }, [client, epoch, id]);
  return result?.id === id && result?.epoch === epoch ? result : undefined;
}
