import { useEffect, useRef } from 'react';

/** Brings newly reported dialog feedback above the pinned command row. */
export function useDialogFeedback(feedback: unknown) {
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => {
      const target = form.current?.querySelector<HTMLElement>(
        '[data-dialog-feedback], [role="alert"]',
      );
      if (!target) return;
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
      target.scrollIntoView?.({ block: 'center' });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [feedback]);
  return form;
}
