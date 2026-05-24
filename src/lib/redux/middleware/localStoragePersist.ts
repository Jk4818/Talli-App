import type { Middleware } from '@reduxjs/toolkit';
import type { SessionState } from '@/lib/types';

export const STORAGE_KEY = 'talli_session_draft';
export const SCHEMA_VERSION = 2;

// Use a local state shape rather than importing RootState to avoid circular references
type LocalState = { session: SessionState };

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const localStoragePersistMiddleware: Middleware<object, LocalState> =
  (storeAPI) => (next) => (action) => {
    const result = next(action);
    const state = storeAPI.getState() as LocalState;

    // Never persist demo sessions
    if (state.session.isDemoSession) {
      clearDraft();
      return result;
    }

    // Clear on explicit reset
    const actionType = (action as { type: string }).type;
    if (actionType === 'session/resetSession') {
      clearDraft();
      return result;
    }

    // Skip saving if session is still empty
    const { participants, receipts, items } = state.session;
    const isActive =
      participants.length > 0 || receipts.length > 0 || items.length > 0;
    if (!isActive) return result;

    // Debounce writes to avoid hammering localStorage on every keystroke
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        // Strip imageDataUri — base64 images are too large for localStorage
        const receiptsToSave = state.session.receipts.map((r) => ({
          ...r,
          imageDataUri: undefined,
        }));

        const draft: SessionDraft = {
          schemaVersion: SCHEMA_VERSION,
          savedAt: new Date().toISOString(),
          session: { ...state.session, receipts: receiptsToSave },
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      } catch {
        // localStorage may be full or unavailable — fail silently
      }
    }, 1000);

    return result;
  };

export interface SessionDraft {
  schemaVersion: number;
  savedAt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
}

export function loadDraft(): SessionDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as SessionDraft;
    if (draft?.schemaVersion !== SCHEMA_VERSION) {
      clearDraft();
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // fail silently
  }
}
