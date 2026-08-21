import { useState, useRef, useEffect, useCallback, type RefObject } from 'react';
import { throttle } from 'throttle-debounce';

export default function useMouseLeave<T extends HTMLElement = HTMLElement>(): readonly [
  boolean,
  (node: T | null) => void,
  RefObject<T | null>,
] {
  const elementRef = useRef<T | null>(null);
  const [mouseLeft, setMouseLeft] = useState(true);

  // Check whether the pointer is still within our element
  const checkBounds = useCallback((event: MouseEvent) => {
    if (!elementRef.current) return;

    const rect = elementRef.current.getBoundingClientRect();

    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      setMouseLeft(true);
    } else {
      setMouseLeft(false);
    }
  }, []);

  // Throttled to every 50ms. `useState`'s lazy initializer runs exactly
  // once, so `checkBounds` (which reads `elementRef.current`, but only
  // when it's actually invoked later, as a real event handler) is never
  // called here -- it's merely handed to `throttle-debounce`, which
  // stores the reference for later. The rule below can't tell the
  // difference between "passed to a function that calls it now" and
  // "passed to a function that stores it for later", so it flags this
  // unconditionally; verified safe via a fresh build + the smoke tests.
  // eslint-disable-next-line react-hooks/refs -- see comment above
  const [handleMouseMove] = useState(() => throttle(50, checkBounds));

  // Fully stops tracking the pointer: removes the live listener (so no
  // further real mousemove can call checkBounds against a since-swapped
  // element) and cancels any trailing throttle call still in flight (so a
  // stale queued call can't fire afterwards either). Used everywhere
  // tracking needs to stop -- mouseLeft flipping true, a ref swap, and
  // unmount -- so those three sites can't drift out of sync again.
  const stopTracking = useCallback(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    handleMouseMove.cancel({ upcomingOnly: true });
  }, [handleMouseMove]);

  // Start tracking the pointer when it enters our element
  const handleMouseEnter = useCallback(() => {
    setMouseLeft(false);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
  }, [handleMouseMove]);

  // See https://medium.com/@teh_builder/ref-objects-inside-useeffect-hooks-eb7c15198780
  // Dynamic ref because the element may be null at times
  const setRef = useCallback(
    (node: T | null) => {
      // Make sure to cleanup any events/references added to the last instance
      elementRef.current?.removeEventListener('mouseenter', handleMouseEnter);

      // The outgoing element's hover session (if any) is over -- don't let
      // its live listener or a queued trailing call touch the new node
      stopTracking();

      // Save a reference to the node (or clear it, if detached)
      elementRef.current = node;

      node?.addEventListener('mouseenter', handleMouseEnter);
    },
    [handleMouseEnter, stopTracking],
  );

  // Cleanup the pointer tracking when the mouse is not over our element anymore
  useEffect(() => {
    if (mouseLeft) {
      stopTracking();
    }
  }, [mouseLeft, stopTracking]);

  useEffect(() => {
    // Cleanup events on component unmount
    return () => {
      elementRef.current?.removeEventListener('mouseenter', handleMouseEnter);
      stopTracking();
    };
  }, [handleMouseEnter, stopTracking]);

  return [mouseLeft, setRef, elementRef] as const;
}
