"use client";

import { useEffect, useRef, useState } from "react";

export function useElementWidth<T extends HTMLElement>(initialWidthPx = 1000) {
  const elementRef = useRef<T | null>(null);
  const [widthPx, setWidthPx] = useState(initialWidthPx);

  useEffect(() => {
    const node = elementRef.current;
    if (!node) {
      return;
    }

    const updateWidth = () => {
      setWidthPx(Math.max(1, node.clientWidth));
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => {
        window.removeEventListener("resize", updateWidth);
      };
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setWidthPx(Math.max(1, entry.contentRect.width));
    });

    resizeObserver.observe(node);

    return () => {
      resizeObserver.disconnect();
    };
  }, [initialWidthPx]);

  return { elementRef, widthPx };
}