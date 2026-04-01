import { columnMappingApi } from '../httpClient/client.js';
import type { ColumnMappingEntry } from '../../shared/types.js';
import { useFetch } from './useFetch.js';

export function useColumnMapping() {
  return useFetch(
    () => columnMappingApi.getAll(),
    {} as Record<string, ColumnMappingEntry[]>,
    [],
  );
}
