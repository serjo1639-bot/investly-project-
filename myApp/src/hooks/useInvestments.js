/**
 * useInvestments — the investor's portfolio + the checkout mutation.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { investmentsApi } from '../api/investmentsApi';
import { queryKeys } from '../constants/queryKeys';

export function useMyInvestments() {
  return useQuery({
    queryKey: queryKeys.investments.mine,
    queryFn: () => investmentsApi.getMine(),
  });
}

export function useInvestmentHistory() {
  return useQuery({
    queryKey: queryKeys.investments.history,
    queryFn: () => investmentsApi.getHistory(),
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => investmentsApi.checkout(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.investments.mine });
      qc.invalidateQueries({ queryKey: queryKeys.wallet });
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}
