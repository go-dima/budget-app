import type {
  DbInfo,
  FilePreviewResponse,
  ImportExecuteResponse,
  ImportRequest,
  ImportResult,
} from "../types";
import apiClient from "./client";

export const adminApi = {
  getDatabases: async (): Promise<DbInfo[]> => {
    const response = await apiClient.get<DbInfo[]>("/admin/databases");
    return response.data;
  },

  deleteDatabase: async (accountId: string): Promise<void> => {
    await apiClient.delete(`/admin/databases/${accountId}`);
  },

  getAllCategories: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>("/admin/categories");
    return response.data;
  },

  getExcludedCategories: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>("/admin/excluded-categories");
    return response.data;
  },

  setExcludedCategories: async (categories: string[]): Promise<string[]> => {
    const response = await apiClient.put<string[]>("/admin/excluded-categories", {
      category_names: categories,
    });
    return response.data;
  },

  importExcel: async (file: File): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<ImportResult>("/import/excel", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  previewImport: async (file: File): Promise<FilePreviewResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<FilePreviewResponse>(
      "/import/preview",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  executeImport: async (request: ImportRequest): Promise<ImportExecuteResponse> => {
    const response = await apiClient.post<ImportExecuteResponse>(
      "/import/execute",
      request
    );
    return response.data;
  },
};
