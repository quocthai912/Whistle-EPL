import { useCallback, useEffect, useState } from 'react';
import { useSession } from '../../shared/http/use-session';

export function useAdminList<T>(path: string) {
  const { client } = useSession();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; data?: T; error?: string }>();
  const key = path + '#' + attempt;
  useEffect(() => {
    let active = true;
    void client
      .request<T>(path)
      .then(({ data }) => {
        if (active) setResult({ key, data });
      })
      .catch((error: unknown) => {
        if (active)
          setResult({
            key,
            error: error instanceof Error ? error.message : 'Không thể tải dữ liệu.',
          });
      });
    return () => {
      active = false;
    };
  }, [client, key, path]);
  const reload = useCallback(() => setAttempt((value) => value + 1), []);
  return { ...(result?.key === key ? result : {}), reload, loading: result?.key !== key };
}
