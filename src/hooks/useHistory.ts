import { useCallback, useRef, useState } from 'react';
import type { ResumeDocument } from '../model/types';

const LIMIT = 100;
/** Edits with the same key closer together than this become one undo step. */
const COALESCE_MS = 1200;

interface History {
  past: ResumeDocument[];
  present: ResumeDocument;
  future: ResumeDocument[];
}

export type Updater = (draft: ResumeDocument) => ResumeDocument | void;

/**
 * Document state with undo/redo. `update` hands the updater a deep copy, so
 * callers can mutate it freely. Pass a `key` (for example a field path) to
 * merge rapid edits like typing into a single undo step.
 */
export function useHistory(initial: () => ResumeDocument) {
  const [state, setState] = useState<History>(() => ({ past: [], present: initial(), future: [] }));
  const last = useRef<{ key?: string; time: number }>({ time: 0 });

  const update = useCallback((fn: Updater, key?: string) => {
    const now = Date.now();
    const merge = key !== undefined && key === last.current.key && now - last.current.time < COALESCE_MS;
    last.current = { key, time: now };
    setState((s) => {
      const draft = structuredClone(s.present);
      const next = fn(draft) ?? draft;
      next.updatedAt = new Date(now).toISOString();
      if (merge) return { ...s, present: next, future: [] };
      return { past: [...s.past, s.present].slice(-LIMIT), present: next, future: [] };
    });
  }, []);

  /** Swap in a whole new document (open, new, sample) as one undoable step. */
  const replace = useCallback((doc: ResumeDocument) => {
    last.current = { time: 0 };
    setState((s) => ({ past: [...s.past, s.present].slice(-LIMIT), present: doc, future: [] }));
  }, []);

  /** Show a different document with a fresh history (switching resumes). */
  const reset = useCallback((doc: ResumeDocument) => {
    last.current = { time: 0 };
    setState({ past: [], present: doc, future: [] });
  }, []);

  const undo = useCallback(() => {
    last.current = { time: 0 };
    setState((s) =>
      s.past.length ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] } : s,
    );
  }, []);

  const redo = useCallback(() => {
    last.current = { time: 0 };
    setState((s) =>
      s.future.length ? { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) } : s,
    );
  }, []);

  return {
    doc: state.present,
    update,
    replace,
    reset,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
