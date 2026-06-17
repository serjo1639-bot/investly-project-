/**
 * usePayments — payment methods + history queries.
 */
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '../api/paymentsApi';
import { queryKeys } from '../constants/queryKeys';

export function usePaymentMethods() {
  return useQuery({
    queryKey: queryKeys.payments.methods,
    queryFn: () => paymentsApi.getMethods(),
    staleTime: 10 * 60 * 1000,
  });
}

export function usePaymentHistory() {
  return useQuery({
    queryKey: queryKeys.payments.history,
    queryFn: () => paymentsApi.getHistory(),
  });
}
