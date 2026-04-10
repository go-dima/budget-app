import { paymentMappingApi } from '../httpClient/client.js';
import type { PaymentMapping } from '../../shared/types.js';
import { useFetch } from './useFetch.js';

export function usePaymentMapping() {
  return useFetch(() => paymentMappingApi.getAll(), [] as PaymentMapping[], []);
}
