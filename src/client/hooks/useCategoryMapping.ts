import { categoryMappingApi } from '../httpClient/client.js';
import type { CategoryMapping } from '../../shared/types.js';
import { useFetch } from './useFetch.js';

export function useCategoryMapping() {
  return useFetch(() => categoryMappingApi.getAll(), [] as CategoryMapping[], []);
}
