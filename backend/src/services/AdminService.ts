import { settingsRepository } from "../db/index.js";
import { accountService } from "./AccountService.js";
import type { DbInfo } from "../types/index.js";

const EXCLUDED_CATEGORIES_KEY = "excluded_categories";

export class AdminService {
  initialize(): void {
    settingsRepository.initialize();
  }

  getExcludedCategories(): string[] {
    return settingsRepository.getJson<string[]>(EXCLUDED_CATEGORIES_KEY) ?? [];
  }

  setExcludedCategories(categories: string[]): string[] {
    settingsRepository.setJson(EXCLUDED_CATEGORIES_KEY, categories);
    return categories;
  }

  getDatabaseInfo(): DbInfo[] {
    return accountService.getDatabaseInfo();
  }

  getAllCategories(): string[] {
    return accountService.getAllCategories();
  }

  deleteDatabase(accountId: string): boolean {
    return accountService.deleteAccount(accountId);
  }
}

export const adminService = new AdminService();
