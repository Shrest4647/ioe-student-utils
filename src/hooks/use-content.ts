import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/eden";

export interface CollegeResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    websiteUrl: string | null;
    location: string | null;
    universityId: string;
    university: {
      id: string;
      name: string;
      slug: string;
    };
    isActive: boolean;
    createdAt: string | Date | null;
    updatedAt: string | Date;
  }[];
  metadata: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface CollegeFilters {
  search?: string;
  universityId?: string;
  page?: string;
  limit?: string;
}

export function useColleges(filters: CollegeFilters) {
  return useInfiniteQuery({
    queryKey: ["colleges", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.api.colleges.get({
        query: {
          search: filters.search || undefined,
          universityId: filters.universityId || undefined,
          page: String(pageParam),
          limit: filters.limit || "12",
        },
      });

      if (response.data?.success) {
        const transformedData = (response.data.data as any[]).map((item) => ({
          ...item,
          createdAt: item.createdAt?.toISOString?.() || item.createdAt,
          updatedAt: item.updatedAt?.toISOString?.() || item.updatedAt,
        }));

        return {
          ...response.data,
          data: transformedData,
        } as CollegeResponse;
      }
      throw new Error("Failed to fetch colleges");
    },
    getNextPageParam: (lastPage: CollegeResponse) => {
      if (lastPage.metadata.hasMore) {
        return lastPage.metadata.currentPage + 1;
      }
      return undefined;
    },
    getPreviousPageParam: (firstPage: CollegeResponse) => {
      if (firstPage.metadata.currentPage > 1) {
        return firstPage.metadata.currentPage - 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCollege(slug: string) {
  return useQuery({
    queryKey: ["college", slug],
    queryFn: async () => {
      const response = await apiClient.api.colleges.slug({ slug }).get();

      if (response.data?.success) {
        return response.data.data;
      }
      throw new Error("Failed to fetch college");
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export interface DepartmentResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    websiteUrl: string | null;
    isActive: boolean;
    createdAt: string | Date | null;
    updatedAt: string | Date;
  }[];
  metadata: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface DepartmentFilters {
  search?: string;
  page?: string;
  limit?: string;
}

export function useDepartments(filters: DepartmentFilters) {
  return useInfiniteQuery({
    queryKey: ["departments", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.api.departments.get({
        query: {
          search: filters.search || undefined,
          page: String(pageParam),
          limit: filters.limit || "12",
        },
      });

      if (response.data?.success) {
        const transformedData = (response.data.data as any[]).map((item) => ({
          ...item,
          createdAt: item.createdAt?.toISOString?.() || item.createdAt,
          updatedAt: item.updatedAt?.toISOString?.() || item.updatedAt,
        }));

        return {
          ...response.data,
          data: transformedData,
        } as DepartmentResponse;
      }
      throw new Error("Failed to fetch departments");
    },
    getNextPageParam: (lastPage: DepartmentResponse) => {
      if (lastPage.metadata.hasMore) {
        return lastPage.metadata.currentPage + 1;
      }
      return undefined;
    },
    getPreviousPageParam: (firstPage: DepartmentResponse) => {
      if (firstPage.metadata.currentPage > 1) {
        return firstPage.metadata.currentPage - 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useDepartment(slug: string) {
  return useQuery({
    queryKey: ["department", slug],
    queryFn: async () => {
      const response = await apiClient.api.departments.slug({ slug }).get();

      if (response.data?.success) {
        return response.data.data as {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          websiteUrl: string | null;
          isActive: boolean;
          createdAt: string | Date | null;
          updatedAt: string | Date;
          colleges: Array<{
            id: string;
            name: string;
            slug: string;
          }>;
        };
      }
      throw new Error("Failed to fetch department");
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export interface ProgramResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    code: string;
    slug: string | null;
    description: string | null;
    credits: string | null;
    degreeLevels:
      | "certificate"
      | "diploma"
      | "associate"
      | "undergraduate"
      | "postgraduate"
      | "doctoral"
      | "postdoctoral"
      | null;
    isActive: boolean;
    createdAt: string | Date | null;
    updatedAt: string | Date | null;
  }[];
  metadata: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface ProgramFilters {
  search?: string;
  degreeLevel?:
    | "certificate"
    | "diploma"
    | "associate"
    | "undergraduate"
    | "postgraduate"
    | "doctoral"
    | "postdoctoral";
  page?: string;
  limit?: string;
}

export function usePrograms(filters: ProgramFilters) {
  return useInfiniteQuery({
    queryKey: ["programs", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.api.programs.get({
        query: {
          search: filters.search || undefined,
          degreeLevel: filters.degreeLevel || undefined,
          page: String(pageParam),
          limit: filters.limit || "12",
        },
      });

      if (response.data?.success) {
        return response.data as ProgramResponse;
      }
      throw new Error("Failed to fetch programs");
    },
    getNextPageParam: (lastPage: ProgramResponse) => {
      if (lastPage.metadata.hasMore) {
        return lastPage.metadata.currentPage + 1;
      }
      return undefined;
    },
    getPreviousPageParam: (firstPage: ProgramResponse) => {
      if (firstPage.metadata.currentPage > 1) {
        return firstPage.metadata.currentPage - 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useProgram(code: string) {
  return useQuery({
    queryKey: ["program", code],
    queryFn: async () => {
      const codeEndpoint = apiClient.api.programs.code({ code });
      const response = await codeEndpoint.get();

      if (response.data?.success) {
        return response.data.data;
      }
      throw new Error("Failed to fetch program");
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export interface CourseResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    code: string;
    slug: string | null;
    description: string | null;
    credits: string | null;
    isActive: boolean;
    createdAt: string | Date | null;
    updatedAt: string | Date;
  }[];
  metadata: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface CourseFilters {
  search?: string;
  programId?: string;
  page?: string;
  limit?: string;
}

export function useCourses(filters: CourseFilters) {
  return useInfiniteQuery({
    queryKey: ["courses", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.api.courses.get({
        query: {
          search: filters.search || undefined,
          programId: filters.programId || undefined,
          page: String(pageParam),
          limit: filters.limit || "12",
        },
      });

      if (response.data?.success) {
        return response.data as CourseResponse;
      }
      throw new Error("Failed to fetch courses");
    },
    getNextPageParam: (lastPage: CourseResponse) => {
      if (lastPage.metadata.hasMore) {
        return lastPage.metadata.currentPage + 1;
      }
      return undefined;
    },
    getPreviousPageParam: (firstPage: CourseResponse) => {
      if (firstPage.metadata.currentPage > 1) {
        return firstPage.metadata.currentPage - 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCourse(code: string) {
  return useQuery({
    queryKey: ["course", code],
    queryFn: async () => {
      const response = await apiClient.api.courses.code({ code }).get();

      if (response?.data?.success) {
        return response.data.data;
      }
      throw new Error("Failed to fetch course");
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useProgramRatings(programId: string, categoryId?: string) {
  return useQuery({
    queryKey: ["program-ratings", programId, categoryId],
    queryFn: async () => {
      const response = await apiClient.api
        .programs({ id: programId })
        .ratings.get({
          query: { categoryId },
        });

      if (response.data?.success) {
        return response.data.data;
      }
      throw new Error("Failed to fetch program ratings");
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCourseRatings(courseId: string, categoryId?: string) {
  return useQuery({
    queryKey: ["course-ratings", courseId, categoryId],
    queryFn: async () => {
      const response = await apiClient.api
        .courses({ id: courseId })
        .ratings.get({
          query: { categoryId },
        });
      if (response.data?.success) {
        return response.data.data;
      }
      throw new Error("Failed to fetch course ratings");
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useProgramCourses(programId: string) {
  return useQuery({
    queryKey: ["program-courses", programId],
    queryFn: async () => {
      const response = await apiClient.api
        .programs({ id: programId })
        .courses.get();
      if (response.data?.success) {
        return response.data.data;
      }
      throw new Error("Failed to fetch program courses");
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCoursePrograms(courseId: string) {
  return useQuery({
    queryKey: ["course-programs", courseId],
    queryFn: async () => {
      const response = await apiClient.api
        .courses({ id: courseId })
        .programs.get();
      if (response.data?.success) {
        return response.data.data;
      }
      throw new Error("Failed to fetch course programs");
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCollegeDepartments(collegeId: string) {
  return useQuery({
    queryKey: ["college-departments", collegeId],
    queryFn: async () => {
      const response = await apiClient.api
        .colleges({ id: collegeId })
        .departments.get();

      if (response.data?.success) {
        return response.data.data as Array<{
          id: string;
          name: string;
          slug: string;
          description: string | null;
          websiteUrl: string | null;
          isActive: boolean;
          collegeId: string;
        }>;
      }
      throw new Error("Failed to fetch college departments");
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useDepartmentColleges(departmentId: string) {
  return useQuery({
    queryKey: ["department-colleges", departmentId],
    queryFn: async () => {
      const response = await apiClient.api
        .departments({ id: departmentId })
        .colleges.get();

      if (response.data?.success) {
        return response.data.data as Array<{
          id: string;
          name: string;
          slug: string;
          description: string | null;
          websiteUrl: string | null;
          university: {
            id: string;
            name: string;
            slug: string;
          };
        }>;
      }
      throw new Error("Failed to fetch department colleges");
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
