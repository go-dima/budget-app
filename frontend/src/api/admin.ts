import { api } from "./client";
import type { DbInfo, FilePreviewResponse, ImportRequest, ImportExecuteResponse } from "../types";

export const adminApi = {
  getDatabases: (): Promise<DbInfo[]> => api.get("/api/admin/databases"),

  deleteDatabase: (accountId: string): Promise<{ success: boolean }> =>
    api.delete(`/api/admin/databases/${accountId}`),

  getCategories: (): Promise<string[]> => api.get("/api/admin/categories"),

  getExcludedCategories: (): Promise<string[]> =>
    api.get("/api/admin/excluded-categories"),

  setExcludedCategories: (categories: string[]): Promise<string[]> =>
    api.put("/api/admin/excluded-categories", { category_names: categories }),
};

export interface DbImportResult {
  success: boolean;
  account_name: string;
  rows_imported: number;
  error?: string;
}

export const importApi = {
  preview: (file: File): Promise<FilePreviewResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/api/import/preview", formData);
  },

  execute: (request: ImportRequest): Promise<ImportExecuteResponse> =>
    api.post("/api/import/execute", request),

  importDatabase: (file: File): Promise<DbImportResult> => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/api/import/database", formData);
  },
};
