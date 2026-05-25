import { useEffect, useState } from 'react';

/**
 * Detect the iOS software keyboard height via the Visual Viewport API.
 *
 * On iOS, the layout viewport does NOT resize when the keyboard appears —
 * the keyboard overlays the content instead. `window.visualViewport.height`
 * shrinks while `window.innerHeight` stays constant, giving us the exact
 * keyboard height as the difference.
 *
 * On Android (with or without `interactive-widget=resizes-content`), BOTH
 * heights shrink together so the difference stays near 0 — this hook returns
 * 0 on Android, which is correct because the fixed drawer already moves up
 * with the viewport there.
 *
 * On desktop, the keyboard never appears and this hook always returns 0.
 *
 * @param enabled  Gate the listener — pass `false` when the overlay is closed
 *                 so no work is done while the component is hidden.
 */
export function useIosKeyboardInset(enabled: boolean): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const kb = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
      setInset(kb);
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      // Reset when disabled so stale inset doesn't linger after close
      setInset(0);
    };
  }, [enabled]);

  return inset;
}
