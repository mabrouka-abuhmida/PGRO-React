/**
 * VirtualizedList - Wrapper component for react-window List
 * Provides virtualization for long lists to improve performance
 */
import React, { useCallback } from "react";
import { List, RowComponentProps } from "react-window";

interface VirtualizedListProps<T> {
  items: T[];
  height?: number;
  itemHeight: number;
  itemWidth?: number | string;
  renderItem: (props: {
    index: number;
    style: React.CSSProperties;
    item: T;
  }) => React.ReactNode;
  className?: string;
  overscanCount?: number;
}

interface RowData<T> {
  items: T[];
  renderItem: (props: {
    index: number;
    style: React.CSSProperties;
    item: T;
  }) => React.ReactNode;
}

export function VirtualizedList<T>({
  items,
  height = 600,
  itemHeight,
  itemWidth = "100%",
  renderItem,
  className,
  overscanCount = 5,
}: VirtualizedListProps<T>) {
  const rowComponent = useCallback(
    ({
      index,
      style,
      items: rowItems,
      renderItem: rowRenderItem,
    }: RowComponentProps<RowData<T>>) => {
      const item = rowItems[index];
      return (
        <React.Fragment>
          {item ? (
            <div style={style}>{rowRenderItem({ index, style, item })}</div>
          ) : (
            <div></div>
          )}
        </React.Fragment>
      );
    },
    [],
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <List
      rowCount={items.length}
      rowHeight={itemHeight}
      rowComponent={rowComponent}
      rowProps={{
        items,
        renderItem,
      }}
      overscanCount={overscanCount}
      className={className}
      style={{
        height,
        width: itemWidth,
      }}
    />
  );
}
