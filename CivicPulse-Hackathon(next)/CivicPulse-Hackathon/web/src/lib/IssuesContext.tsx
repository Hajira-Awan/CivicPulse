import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { apiGet, apiPost, apiPatch } from "./api";

export type ReportImage = {
  id: string;
  reportId: string;
  url: string;
  type: "before" | "after";
};

export type Issue = {
  id: string;
  title: string;
  description?: string;
  city: string;
  area?: string;
  category: string;
  severity?: string;
  priority: string;
  status: string;
  latitude?: number;
  longitude?: number;
  authorId: string;
  authorName: string;
  assignedDeptId?: string;
  assignedOfficerId?: string;
  upvoteCount: number;
  resolvedAt?: string;
  officerNotes?: string;
  createdAt: string;
  updatedAt: string;
  images?: ReportImage[];
  aiAnalysis?: any;
  userUpvoted?: boolean;
};

type Filters = {
  search?: string;
  city?: string;
  category?: string;
  status?: string;
  sort?: string;
};

type IssuesContextType = {
  issues: Issue[];
  total: number;
  loading: boolean;
  filters: Filters;
  setFilters: (f: Filters) => void;
  fetchIssues: (filters?: Filters) => Promise<void>;
  reportIssue: (data: any) => Promise<Issue>;
  updateIssueStatus: (id: string, status: string, officerNotes?: string) => Promise<void>;
  upvoteIssue: (id: string) => Promise<{ upvoted: boolean; upvoteCount: number }>;
  getIssue: (id: string) => Promise<Issue>;
};

const IssuesContext = createContext<IssuesContextType | undefined>(undefined);

export const IssuesProvider = ({ children }: { children: ReactNode }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({});

  const fetchIssues = useCallback(async (f?: Filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const activeFilters = f || filters;
      if (activeFilters.search) params.set("search", activeFilters.search);
      if (activeFilters.city) params.set("city", activeFilters.city);
      if (activeFilters.category) params.set("category", activeFilters.category);
      if (activeFilters.status) params.set("status", activeFilters.status);
      if (activeFilters.sort) params.set("sort", activeFilters.sort);

      const data = await apiGet<{ reports: Issue[]; total: number }>(
        `/api/reports?${params.toString()}`
      );
      setIssues(data.reports);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to fetch issues:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const reportIssue = async (data: any): Promise<Issue> => {
    const result = await apiPost<{ report: Issue }>("/api/reports", data);
    await fetchIssues();
    return result.report;
  };

  const updateIssueStatus = async (id: string, status: string, officerNotes?: string) => {
    await apiPatch(`/api/reports/${id}/status`, { status, officerNotes });
    await fetchIssues();
  };

  const upvoteIssue = async (id: string) => {
    const result = await apiPost<{ upvoted: boolean; upvoteCount: number }>(`/api/reports/${id}/upvote`);
    await fetchIssues();
    return result;
  };

  const getIssue = async (id: string): Promise<Issue> => {
    const data = await apiGet<{ report: Issue }>(`/api/reports/${id}`);
    return data.report;
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  return (
    <IssuesContext.Provider value={{
      issues, total, loading, filters, setFilters,
      fetchIssues, reportIssue, updateIssueStatus, upvoteIssue, getIssue
    }}>
      {children}
    </IssuesContext.Provider>
  );
};

export const useIssues = () => {
  const context = useContext(IssuesContext);
  if (context === undefined) {
    throw new Error("useIssues must be used within an IssuesProvider");
  }
  return context;
};
