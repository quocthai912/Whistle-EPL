import { useEffect, useState } from 'react';

/** Waits for a short typing pause before requesting another server-filtered page. */
export function useSearchTerm(draft: string) {
  const [term, setTerm] = useState(draft.trim());
  useEffect(() => {
    const timer = setTimeout(() => setTerm(draft.trim()), 300);
    return () => clearTimeout(timer);
  }, [draft]);
  return term;
}
