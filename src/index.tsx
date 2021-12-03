import { useState, useRef, useEffect, useCallback /*, useLayoutEffect*/ } from 'react';
import { throttle } from 'throttle-debounce';

export default function useMouseLeave() {
  const [mouseLeft, setMouseLeft] = useState(true);
  const elementRef = useRef<HTMLElement | null>(null);

  // Check whether the pointer is still within our element, every 50ms
  const handleMouseMove = useRef(
    throttle(50, (e: MouseEvent) => {
      if (!elementRef || !elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();

      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
        setMouseLeft(true);
      } else {
        setMouseLeft(false);
      }
    }),
  ).current;

  // Start tracking the pointer when it enters our element
  const handleMouseEnter = useRef(() => {
    setMouseLeft(false);
    window.addEventListener('mousemove', handleMouseMove);
  }).current;

  // See https://medium.com/@teh_builder/ref-objects-inside-useeffect-hooks-eb7c15198780
  // Dynamic ref because the element may be null at times
  const setRef = useCallback((node: HTMLElement | null) => {
    // Make sure to cleanup any events/references added to the last instance
    if (elementRef && elementRef.current) {
      elementRef.current.removeEventListener('mouseenter', handleMouseEnter);
    }

    if (node !== null) {
      node.addEventListener('mouseenter', handleMouseEnter);

      // Save a reference to the node
      elementRef.current = node;
    }
  }, []);

  // Cleanup the pointer tracking when the mouse is not over our element anymore
  // useLayoutEffect(() => {
  useEffect(() => {
    if (mouseLeft) {
      window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [mouseLeft]);

  useEffect(() => {
    // Cleanup events on component unmount
    return () => {
      if (elementRef && elementRef.current) {
        elementRef.current.removeEventListener('mouseenter', handleMouseEnter);
      }
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return [mouseLeft, setRef, elementRef] as const;
}
