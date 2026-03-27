/**
 * AllocationsList - Virtualized list component for allocations
 * Uses react-window for performance with large datasets
 */
import React, { useMemo, useCallback } from "react";
import { List, RowComponentProps } from "react-window";
import type { Allocation } from "@/types";
import "./AllocationsList.css";

interface AllocationGroup {
  applicant_id: string;
  allocations: Allocation[];
}

interface AllocationsListProps {
  grouped: AllocationGroup[];
  ungrouped: Allocation[];
  loading?: boolean;
  renderGroup: (group: AllocationGroup, index: number) => React.ReactNode;
  renderUngrouped: (allocation: Allocation, index: number) => React.ReactNode;
}

interface RowData {
  items: Array<{
    type: "group" | "ungrouped";
    data: AllocationGroup | Allocation;
    index: number;
  }>;
  renderGroup: (group: AllocationGroup, index: number) => React.ReactNode;
  renderUngrouped: (allocation: Allocation, index: number) => React.ReactNode;
}

// Flatten groups and ungrouped into a single list for virtualization
const flattenAllocations = (
  grouped: AllocationGroup[],
  ungrouped: Allocation[],
) => {
  const items: Array<{
    type: "group" | "ungrouped";
    data: AllocationGroup | Allocation;
    index: number;
  }> = [];

  grouped.forEach((group, groupIndex) => {
    items.push({ type: "group", data: group, index: groupIndex });
  });

  ungrouped.forEach((allocation, ungroupedIndex) => {
    items.push({ type: "ungrouped", data: allocation, index: ungroupedIndex });
  });

  return items;
};

export const AllocationsList: React.FC<AllocationsListProps> = ({
  grouped,
  ungrouped,
  loading = false,
  renderGroup,
  renderUngrouped,
}) => {
  const flattenedItems = useMemo(
    () => flattenAllocations(grouped, ungrouped),
    [grouped, ungrouped],
  );

  if (loading) {
    return <div className="allocations-loading">Loading allocations...</div>;
  }

  if (flattenedItems.length === 0) {
    return (
      <div className="allocations-empty">
        <p>No allocations found matching the filters.</p>
      </div>
    );
  }

  // For small lists, render without virtualization
  if (flattenedItems.length <= 10) {
    return (
      <div className="allocations-list">
        {grouped.map((group, index) => (
          <div key={group.applicant_id}>{renderGroup(group, index)}</div>
        ))}
        {ungrouped.map((allocation, index) => (
          <div key={allocation.id}>{renderUngrouped(allocation, index)}</div>
        ))}
      </div>
    );
  }

  // For large lists, use virtualization
  const itemHeight = 300; // Approximate height per item
  const containerHeight = Math.min(800, flattenedItems.length * itemHeight);

  const rowComponent = ({
    index,
    style,
    items: rowItems,
    renderGroup: rowRenderGroup,
    renderUngrouped: rowRenderUngrouped,
  }: RowComponentProps<RowData>) => {
    type ElementType<T> = T extends (infer U)[] ? U : T;
    type TItem = ElementType<typeof rowItems>;
    const item: TItem | null = rowItems[index];

    return (
      <div style={style}>
        {item && item.type === "group"
          ? rowRenderGroup(item.data as AllocationGroup, item.index)
          : rowRenderUngrouped(item.data as Allocation, item.index)}
      </div>
    );
  };

  return (
    <div className="allocations-virtualized-container">
      <List
        rowCount={flattenedItems.length}
        rowHeight={itemHeight}
        rowComponent={rowComponent}
        rowProps={{
          items: flattenedItems,
          renderGroup,
          renderUngrouped,
        }}
        style={{
          height: containerHeight,
          width: "100%",
        }}
      />
    </div>
  );
};
