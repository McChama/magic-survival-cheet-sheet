import { useEffect, useRef, useState } from "react";

/**
 * The size (in CSS px) of the element the returned ref is attached to, kept up to date as it resizes. Give it an element with
 * no padding of its own (`h-full`, `flex-1`...): the paged lists measure how much room they have and show as many items as fit.
 * The first measurement arrives from the observer right after mount, so the first paint uses `{ width: 0, height: 0 }`.
 */
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      setSize((previous) => (previous.width === element.clientWidth && previous.height === element.clientHeight ? previous : { width: element.clientWidth, height: element.clientHeight }));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}

interface GridCapacityInput {
  width: number;
  height: number;
  columns: number;
  columnGap: number;
  rowGap: number;
  /** A cell's height / width. */
  aspect: number;
}

/** How many cells of a `columns`-wide grid fit in `width` x `height` without scrolling (whole rows only, at least one). */
export function gridCapacity({ width, height, columns, columnGap, rowGap, aspect }: GridCapacityInput): number {
  if (width <= 0 || height <= 0) return columns;
  const cellWidth = (width - columnGap * (columns - 1)) / columns;
  const rows = Math.max(1, Math.floor((height + rowGap) / (cellWidth * aspect + rowGap)));
  return rows * columns;
}
