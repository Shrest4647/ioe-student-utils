"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { useDebounceCallback } from "usehooks-ts";

export type CollegeDepartmentFilters = {
  search: string;
  collegeId?: string;
  page: number;
};

export function useCollegeDepartmentFilters(collegeId?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const createQueryString = useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams?.toString());

      for (const [key, value] of Object.entries(params)) {
        if (value === null || value === "") {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      }

      return newSearchParams.toString();
    },
    [searchParams],
  );

  const setFilter = useCallback(
    (key: keyof CollegeDepartmentFilters, value: string | number | null) => {
      startTransition(() => {
        const queryString = createQueryString({
          [key]: value,
          page: 1,
          ...(collegeId && { collegeId }),
        });
        router.push(`${pathname}?${queryString}`, { scroll: false });
      });
    },
    [createQueryString, pathname, router, collegeId],
  );

  const resetFilters = useCallback(() => {
    startTransition(() => {
      const queryString = createQueryString({
        search: null,
        ...(collegeId && { collegeId }),
        page: 1,
      });
      router.push(`${pathname}?${queryString}`, { scroll: false });
    });
  }, [createQueryString, pathname, router, collegeId]);

  const setPage = useCallback(
    (page: number) => {
      startTransition(() => {
        const queryString = createQueryString({
          page,
          ...(collegeId && { collegeId }),
        });
        router.push(`${pathname}?${queryString}`);
      });
    },
    [createQueryString, pathname, router, collegeId],
  );

  const debouncedSetSearch = useDebounceCallback((value: string) => {
    setFilter("search", value);
  }, 500);

  return {
    filters: {
      search: searchParams?.get("search") ?? "",
      collegeId,
      page: Number(searchParams?.get("page")) || 1,
    },
    setFilter,
    setPage,
    debouncedSetSearch,
    resetFilters,
    isPending,
  };
}
