"use client";
import { useCallback, useEffect, useRef } from "react";

/**
 * A hook that delays the execution of a function until a specified time
 * has passed since the last time it was invoked.
 *
 * @param callback The function to execute
 * @param delay The delay in milliseconds
 * @returns A debounced version of the callback
 */
export function useDebounceCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
) {
  // Use a ref to store the latest callback to avoid stale closures
  // without needing to reset the timer when the callback reference changes.
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup the timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  );
}
