import type React from 'react';

/**
 * `onFocusCapture` handler for any scrollable container that holds inputs.
 *
 * When an INPUT, TEXTAREA, or SELECT gains focus, waits 350 ms for the
 * keyboard animation to finish then calls `scrollIntoView({ block: 'nearest' })`.
 *
 * This covers both iOS (keyboard overlays content) and Android (Radix
 * ScrollArea uses `overflow: hidden` on its root, so the browser won't
 * auto-scroll through it). The 350 ms delay matches the iOS keyboard
 * slide-up animation (~300 ms) so the viewport has settled before we scroll.
 *
 * Defined at module scope (not inside a component) so it is a stable
 * reference — safe to use directly as an `onFocusCapture` prop value
 * without `useCallback`.
 */
export function handleFocusCapture(e: React.FocusEvent): void {
  const target = e.target as HTMLElement;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
    setTimeout(() => {
      target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 350);
  }
}
