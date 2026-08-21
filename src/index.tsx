import { useState, useRef, useEffect, useCallback, type RefObject } from 'react';
import { throttle } from 'throttle-debounce';

export default function useMouseLeave<T extends HTMLElement = HTMLElement>(): readonly [
  boolean,
  (node: T | null) => void,
  RefObject<T | null>,
] {
  const elementRef = useRef<T | null>(null);
  const [mouseLeft, setMouseLeft] = useState(true);

  // A DOM descendant outside our box (absolute/fixed/transformed) still
  // counts as "inside", matching native mouseenter/leave. Content rendered
  // via a portal isn't a DOM descendant, so it falls through to `rect` below.
  const checkBounds = useCallback((event: MouseEvent) => {
    if (!elementRef.current) return;

    if (event.target instanceof Node && elementRef.current.contains(event.target)) {
      setMouseLeft(false);
      return;
    }

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

  // `useState`'s lazy initializer runs exactly once, so `checkBounds` here
  // is merely handed to `throttle-debounce` to store for later, never
  // invoked now -- confirmed via `npm run build` and `npm test`.
  //
  // eslint-disable-next-line react-hooks/refs -- see comment above
  const [handleMouseMove] = useState(() => throttle(50, checkBounds));

  // Removes the live listener and cancels any pending trailing throttle
  // call, so neither can fire against a since-swapped element. Used at
  // every site where tracking needs to stop.
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

      // The outgoing element's hover session (if any) ends here
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
