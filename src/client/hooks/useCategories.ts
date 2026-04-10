import { categoriesApi } from '../httpClient/client.js';
import type { Category } from '../../shared/types.js';
import { useFetch } from './useFetch.js';

export function useCategories() {
  return useFetch(() => categoriesApi.getAll(), [] as Category[], []);
}
