import { useState } from "react";
import type { ReactNode } from "react";
import { gridCapacity, useElementSize } from "../../hooks/useElementSize";
import { Pager } from "./Pager";

interface PagedGridProps<T> {
  items: T[];
  columns: number;
  /** Gap between cells, in px (both axes). */
  gap: number;
  /** A cell's height / width (1 for a square tile). */
  aspect: number;
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  empty?: ReactNode;
}

/**
 * A grid that never scrolls: it measures the room it has, shows as many whole rows of `columns` cells as fit and pages through
 * the rest with a `Pager` under it (only the Owned Magic / Owned Artifact / Synergy screens scroll). Give it a `key` when the
 * items change kind, so paging starts over.
 */
export function PagedGrid<T>({ items, columns, gap, aspect, getKey, renderItem, empty }: PagedGridProps<T>) {
  const [areaRef, area] = useElementSize<HTMLDivElement>();
  const [page, setPage] = useState(0);
  const perPage = gridCapacity({ width: area.width, height: area.height, columns, columnGap: gap, rowGap: gap, aspect });
  const pages = Math.max(1, Math.ceil(items.length / perPage));
  const current = Math.min(page, pages - 1);
  const visible = items.slice(current * perPage, (current + 1) * perPage);

  return (
    <div className="flex-1 min-h-0 flex flex-col px-4">
      <div ref={areaRef} className="flex-1 min-h-0 pt-1.5">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap }}>
          {visible.map((item) => (
            <div key={getKey(item)} className="contents">
              {renderItem(item)}
            </div>
          ))}
        </div>
        {items.length === 0 && empty}
      </div>
      <Pager page={current} pages={pages} onChange={setPage} />
    </div>
  );
}

interface PagedListProps<T> {
  items: T[];
  /** A generous height for one row, in px: the page holds as many as fit at this size. */
  rowHeight: number;
  /** Gap between rows, in px. */
  gap: number;
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
}

/** A column of rows that never scrolls — the same paging as `PagedGrid`, for rows of varying height. */
export function PagedList<T>({ items, rowHeight, gap, getKey, renderItem }: PagedListProps<T>) {
  const [areaRef, area] = useElementSize<HTMLDivElement>();
  const [page, setPage] = useState(0);
  const perPage = area.height > 0 ? Math.max(1, Math.floor((area.height + gap) / (rowHeight + gap))) : 3;
  const pages = Math.max(1, Math.ceil(items.length / perPage));
  const current = Math.min(page, pages - 1);
  const visible = items.slice(current * perPage, (current + 1) * perPage);

  return (
    <div className="flex-1 min-h-0 flex flex-col px-4">
      <div ref={areaRef} className="flex-1 min-h-0 overflow-hidden flex flex-col" style={{ gap }}>
        {visible.map((item) => (
          <div key={getKey(item)} className="flex-none">
            {renderItem(item)}
          </div>
        ))}
      </div>
      <Pager page={current} pages={pages} onChange={setPage} />
    </div>
  );
}
