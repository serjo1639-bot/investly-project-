/**
 * useWallet — wallet balance + top-up / withdraw / redeem mutations.
 * Mutations invalidate the wallet query so the balance updates instantly.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { investmentsApi } from '../api/investmentsApi';
import { queryKeys } from '../constants/queryKeys';

export function useWallet() {
  return useQuery({
    queryKey: queryKeys.wallet,
    queryFn: () => investmentsApi.getWallet(),
  });
}

export function useFundingOptions() {
  return useQuery({
    queryKey: queryKeys.investments.fundingOptions,
    queryFn: () => investmentsApi.getFundingOptions(),
    staleTime: 10 * 60 * 1000,
  });
}

function useWalletMutation(mutationFn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.wallet });
      qc.invalidateQueries({ queryKey: queryKeys.payments.history });
    },
  });
}

export function useTopup() {
  return useWalletMutation((payload) => investmentsApi.topup(payload));
}

export function useWithdraw() {
  return useWalletMutation((payload) => investmentsApi.withdraw(payload));
}

export function useRedeemCode() {
  return useWalletMutation((code) => investmentsApi.redeemCode(code));
}
