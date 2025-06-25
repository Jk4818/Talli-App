'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setIsMobile } from '@/lib/redux/slices/uiSlice';
import type { AppDispatch } from '@/lib/redux/store';

const MOBILE_BREAKPOINT = 768;

export function UIStateInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    // Dispatch the initial state
    dispatch(setIsMobile(mql.matches));

    const listener = (e: MediaQueryListEvent) => {
      dispatch(setIsMobile(e.matches));
    };

    mql.addEventListener('change', listener);

    return () => {
      mql.removeEventListener('change', listener);
    };
  }, [dispatch]);

  return <>{children}</>;
}
