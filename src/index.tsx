import { useState, useRef, useEffect, useCallback, type RefObject } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

/**
 * Minimal pub/sub store backing the hook's `mouseLeft` value via
 * useSyncExternalStore, instead of useState. This lets the mousemove
 * handler (below) update the value directly without needing React
 * to hand it a fresh setState closure on every render.
 */
function createMouseLeftStore() {
  let mouseLeft = true;
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => mouseLeft,
    setMouseLeft(next: boolean) {
      if (mouseLeft === next) return;
      mouseLeft = next;
      listeners.forEach((listener) => listener());
    },
    subscribe(onStoreChange: () => void) {
      listeners.add(onStoreChange);
      return () => {
        listeners.delete(onStoreChange);
      };
    },
  };
}

export default function useMouseLeave<T extends HTMLElement = HTMLElement>(): readonly [
  boolean,
  (node: T | null) => void,
  RefObject<T | null>,
] {
  const elementRef = useRef<T | null>(null);

  // `useState`'s lazy initializer is guaranteed by React to run exactly
  // once and doesn't involve reading a ref during render, unlike the
  // `useRef`-based lazy-init idiom -- see the react-hooks/refs rule (part
  // of the React Compiler-aligned rules in eslint-plugin-react-hooks 6+):
  // reading `ref.current` synchronously during render is never safe, even
  // when guarded. The setter is intentionally unused: this value never
  // needs to trigger a re-render on its own.
  const [store] = useState(createMouseLeftStore);

  const mouseLeft = useSyncExternalStore(store.subscribe, store.getSnapshot);

  // Throttle bookkeeping for handleMouseMove below (leading + trailing,
  // mirroring what the `throttle-debounce` package's defaults did -- kept
  // as plain refs, and read only from inside the callback itself, never
  // during render, so this stays a zero-runtime-dependency library)
  const lastInvokeTimeRef = useRef(0);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingEventRef = useRef<MouseEvent | undefined>(undefined);

  // Check whether the pointer is still within our element, throttled to every 50ms
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      const checkBounds = (e: MouseEvent) => {
        if (!elementRef.current) return;

        const rect = elementRef.current.getBoundingClientRect();

        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
          store.setMouseLeft(true);
        } else {
          store.setMouseLeft(false);
        }
      };

      const delay = 50;
      const now = Date.now();
      const remaining = delay - (now - lastInvokeTimeRef.current);

      if (remaining <= 0) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = undefined;
        lastInvokeTimeRef.current = now;
        checkBounds(event);
        return;
      }

      pendingEventRef.current = event;
      if (timeoutIdRef.current === undefined) {
        timeoutIdRef.current = setTimeout(() => {
          timeoutIdRef.current = undefined;
          lastInvokeTimeRef.current = Date.now();
          if (pendingEventRef.current) checkBounds(pendingEventRef.current);
        }, remaining);
      }
    },
    [store],
  );

  // Start tracking the pointer when it enters our element
  const handleMouseEnter = useCallback(() => {
    store.setMouseLeft(false);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
  }, [store, handleMouseMove]);

  // See https://medium.com/@teh_builder/ref-objects-inside-useeffect-hooks-eb7c15198780
  // Dynamic ref because the element may be null at times
  const setRef = useCallback(
    (node: T | null) => {
      // Make sure to cleanup any events/references added to the last instance
      elementRef.current?.removeEventListener('mouseenter', handleMouseEnter);

      // Save a reference to the node (or clear it, if detached)
      elementRef.current = node;

      node?.addEventListener('mouseenter', handleMouseEnter);
    },
    [handleMouseEnter],
  );

  // Cleanup the pointer tracking when the mouse is not over our element anymore
  useEffect(() => {
    if (mouseLeft) {
      window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [mouseLeft, handleMouseMove]);

  useEffect(() => {
    // Cleanup events on component unmount
    return () => {
      elementRef.current?.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseEnter, handleMouseMove]);

  return [mouseLeft, setRef, elementRef] as const;
}
