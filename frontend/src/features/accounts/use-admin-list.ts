import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from '../../shared/http/use-session';

/** Keeps the last successful data for the same query while a refresh is pending or fails. */
export function useAdminList<T>(path: string) {
  const { client } = useSession();
  const [attempt, setAttempt] = useState(0);
  // A return to the same path starts a new request while retaining any matching data.
  const request = useMemo(() => ({ client, path, attempt }), [client, path, attempt]);
  const [result, setResult] = useState<{ request: typeof request; data?: T; error?: string }>();
  useEffect(() => {
    let active = true;
    void request.client
      .request<T>(request.path)
      .then(({ data }) => {
        if (active) setResult({ request, data });
      })
      .catch((error: unknown) => {
        if (active)
          setResult((previous) => ({
            request,
            data: previous?.request.path === request.path ? previous.data : undefined,
            error: error instanceof Error ? error.message : 'Không thể tải dữ liệu.',
          }));
      });
    return () => {
      active = false;
    };
  }, [request]);
  const reload = useCallback(() => setAttempt((value) => value + 1), []);
  const loading = result?.request !== request;
  return {
    data: result?.request.path === path ? result.data : undefined,
    error: loading ? undefined : result?.error,
    reload,
    loading,
  };
}
