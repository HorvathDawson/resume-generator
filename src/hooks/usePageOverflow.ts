import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { measurePages } from '../model/autofit';

const PX_PER_CM = 96 / 2.54;

/**
 * Measures how far each page's content runs past the bottom of the page, in
 * cm. Measures the unscaled print copy of the resume so zoom doesn't matter.
 */
export function usePageOverflow(root: RefObject<HTMLElement | null>, deps: unknown): Record<string, number> {
  const [overflow, setOverflow] = useState<Record<string, number>>({});

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const result: Record<string, number> = {};
        for (const page of measurePages(el)) {
          const bottom = Math.max(page.limit, ...page.placements.map((p) => p.bottom));
          const over = (bottom - page.limit) / PX_PER_CM;
          if (over > 0.05) result[page.id] = Math.round(over * 10) / 10;
        }
        setOverflow((prev) => (JSON.stringify(prev) === JSON.stringify(result) ? prev : result));
      });
    };
    measure();
    // Web fonts change text metrics once they arrive.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => cancelAnimationFrame(frame);
  }, [root, deps]);

  return overflow;
}
