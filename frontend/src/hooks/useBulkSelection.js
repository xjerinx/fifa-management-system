import { useState, useCallback, useMemo } from "react";

/**
 * Custom hook for managing multi-selection and bulk operations across lists/tables.
 *
 * @param {string} idKey - Name of the primary key field (e.g. 'team_id', 'player_id')
 * @returns Object with selection state and action helpers
 */
export function useBulkSelection(idKey = "id") {
  const [selectedMap, setSelectedMap] = useState({});
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => {
      if (prev) {
        setSelectedMap({});
      }
      return !prev;
    });
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedMap({});
  }, []);

  const selectedIds = useMemo(() => {
    return Object.keys(selectedMap)
      .filter((k) => selectedMap[k])
      .map((k) => {
        // Convert numeric strings back to numbers if appropriate
        const num = Number(k);
        return !isNaN(num) && String(num) === k ? num : k;
      });
  }, [selectedMap]);

  const selectedCount = selectedIds.length;

  const isSelected = useCallback(
    (id) => Boolean(selectedMap[String(id)]),
    [selectedMap]
  );

  const toggleSelect = useCallback((id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setSelectedMap((prev) => {
      const key = String(id);
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedMap({});
  }, []);

  const toggleSelectAll = useCallback(
    (visibleItems = []) => {
      if (!visibleItems.length) return;
      const allSelected = visibleItems.every((item) =>
        Boolean(selectedMap[String(item[idKey])])
      );

      setSelectedMap((prev) => {
        const next = { ...prev };
        if (allSelected) {
          // Deselect all visible
          visibleItems.forEach((item) => {
            delete next[String(item[idKey])];
          });
        } else {
          // Select all visible
          visibleItems.forEach((item) => {
            next[String(item[idKey])] = true;
          });
        }
        return next;
      });
    },
    [selectedMap, idKey]
  );

  const getSelectAllState = useCallback(
    (visibleItems = []) => {
      if (!visibleItems.length) {
        return { isAllSelected: false, isIndeterminate: false, count: 0 };
      }
      const visibleCount = visibleItems.filter((item) =>
        Boolean(selectedMap[String(item[idKey])])
      ).length;

      return {
        isAllSelected: visibleCount === visibleItems.length && visibleItems.length > 0,
        isIndeterminate: visibleCount > 0 && visibleCount < visibleItems.length,
        count: visibleCount,
      };
    },
    [selectedMap, idKey]
  );

  return {
    isSelectionMode,
    setIsSelectionMode,
    toggleSelectionMode,
    exitSelectionMode,
    selectedIds,
    selectedCount,
    isSelected,
    toggleSelect,
    clearSelection,
    toggleSelectAll,
    getSelectAllState,
  };
}
