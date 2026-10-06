"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

/*
 * Small dependency-free sortable (HTML5 drag and drop on a handle) used by the sections rail and the list repeaters.
 *  - pointer: drag the handle, a drop line shows where the item lands;
 *  - keyboard: focus the handle and press ArrowUp / ArrowDown (Home / End jump to the ends); focus follows the item;
 *  - screen readers: every pick-up / move / drop is announced through the returned `live` text (render it in an aria-live region).
 * Touch devices have no native drag events, so every list also offers explicit move up / move down controls.
 * All returned callbacks are stable (latest props are read through a ref) so memoised rows do not re-render while typing.
 */
export function useSortable({ ids, labelOf, onMove }) {
  const [drag, setDrag] = useState(null); // { id, overId, pos }
  const [live, setLive] = useState("");
  const focusId = useRef(null);
  const dragId = useRef(null);
  const posRef = useRef("after");
  const latest = useRef({ ids, labelOf, onMove });
  useLayoutEffect(() => {
    latest.current = { ids, labelOf, onMove };
  });

  const move = useCallback((id, to, { keepFocus = false } = {}) => {
    const { ids: list, onMove: commit, labelOf: label } = latest.current;
    const from = list.indexOf(id);
    const target = Math.max(0, Math.min(list.length - 1, to));
    if (from < 0 || from === target) return;
    if (keepFocus) focusId.current = id;
    commit(from, target);
    setLive(`${label(id)} moved to position ${target + 1} of ${list.length}.`);
  }, []);

  // keep keyboard focus on the moved handle (React re-orders the DOM node, which can drop focus)
  const orderKey = ids.join("|");
  useLayoutEffect(() => {
    if (!focusId.current) return;
    const el = document.querySelector(`[data-sortable-handle="${CSS.escape(focusId.current)}"]`);
    focusId.current = null;
    el?.focus();
  }, [orderKey]);

  const handleProps = useCallback(
    (id) => ({
      "data-sortable-handle": id,
      draggable: true,
      onDragStart: (e) => {
        const item = e.currentTarget.closest("[data-sortable-item]");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
        if (item) e.dataTransfer.setDragImage(item, 16, 16);
        dragId.current = id;
        setDrag({ id, overId: null, pos: "after" });
        const { ids: list, labelOf: label } = latest.current;
        setLive(`Picked up ${label(id)}. Position ${list.indexOf(id) + 1} of ${list.length}.`);
      },
      onDragEnd: () => {
        dragId.current = null;
        setDrag(null);
      },
      onKeyDown: (e) => {
        const { ids: list } = latest.current;
        const at = list.indexOf(id);
        if (e.key === "ArrowUp") move(id, at - 1, { keepFocus: true });
        else if (e.key === "ArrowDown") move(id, at + 1, { keepFocus: true });
        else if (e.key === "Home") move(id, 0, { keepFocus: true });
        else if (e.key === "End") move(id, list.length - 1, { keepFocus: true });
        else return;
        e.preventDefault();
      },
    }),
    [move]
  );

  const itemProps = useCallback(
    (id) => ({
      "data-sortable-item": id,
      onDragOver: (e) => {
        if (!dragId.current) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dragId.current === id) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = e.clientY > rect.top + rect.height / 2 ? "after" : "before";
        posRef.current = pos;
        setDrag((d) => (d && (d.overId !== id || d.pos !== pos) ? { ...d, overId: id, pos } : d));
      },
      onDrop: (e) => {
        if (!dragId.current) return;
        e.preventDefault();
        const { ids: list, onMove: commit, labelOf: label } = latest.current;
        const from = list.indexOf(dragId.current);
        const over = list.indexOf(id);
        let to = over + (posRef.current === "after" ? 1 : 0);
        if (from < to) to -= 1;
        const movedId = dragId.current;
        dragId.current = null;
        setDrag(null);
        if (from >= 0 && to !== from) {
          commit(from, to);
          setLive(`${label(movedId)} moved to position ${to + 1} of ${list.length}.`);
        }
      },
    }),
    []
  );

  /** "before" | "after" on the item currently hovered by a drag, else null. */
  const dropMark = (id) => (drag && drag.overId === id && drag.id !== id ? drag.pos : null);
  return { handleProps, itemProps, dropMark, draggingId: drag?.id || null, move, live, announce: setLive };
}
