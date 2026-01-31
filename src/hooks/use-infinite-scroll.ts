"use client";

import { type RefObject, useEffect, useRef } from "react";

interface UseInfiniteScrollOptions {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  enabled?: boolean;
}

export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  enabled = true,
}: UseInfiniteScrollOptions): RefObject<HTMLDivElement | null> {
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !hasNextPage || !observerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        rootMargin: "100px",
        threshold: 0,
      },
    );

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, enabled]);

  return observerRef;
}
