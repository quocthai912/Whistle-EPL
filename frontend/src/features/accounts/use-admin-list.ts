import { useCallback, useEffect, useState } from 'react';
import { useSession } from '../../shared/http/use-session';

/** Keeps the last successful data for the same query while a refresh is pending or fails. */
export function useAdminList<T>(path: string) {
  const { client } = useSession();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ path: string; key: string; data?: T; error?: string }>();
  const key = path + '#' + attempt;
  useEffect(() => {
    let active = true;
    void client
      .request<T>(path)
      .then(({ data }) => {
        if (active) setResult({ path, key, data });
      })
      .catch((error: unknown) => {
        if (active)
          setResult((previous) => ({
            path,
            key,
            data: previous?.path === path ? previous.data : undefined,
            error: error instanceof Error ? error.message : 'Không thể tải dữ liệu.',
          }));
      });
    return () => {
      active = false;
    };
  }, [client, key, path]);
  const reload = useCallback(() => setAttempt((value) => value + 1), []);
  const loading = result?.key !== key;
  return {
    data: result?.path === path ? result.data : undefined,
    error: loading ? undefined : result?.error,
    reload,
    loading,
  };
}
