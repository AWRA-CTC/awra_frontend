"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { erc20Abi, formatUnits, parseUnits, zeroAddress, type Hash } from "viem";
import {
  env,
  hasSupportedTokens,
  hasValidLendingPoolAddress,
} from "@/config/env";
import { lendingPoolAbi } from "@/contracts/lendingPool";
import type { LendingAction, LendingToken } from "@/types/lending";

const actionToFunctionName: Record<LendingAction, "deposit" | "borrow" | "repay" | "withdraw"> = {
  deposit: "deposit",
  borrow: "borrow",
  repay: "repay",
  withdraw: "withdraw",
};

const BIGINT_ZERO = BigInt(0);

const formatTokenAmount = (value: bigint | undefined, decimals = 18) => {
  if (value === undefined) return "0";

  const num = Number(formatUnits(value, decimals));
  if (Number.isNaN(num)) return "0";
  return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
};

type TokenMarket = LendingToken & {
  walletBalance: string;
  poolLiquidity: string;
  collateral: string;
  debt: string;
  hasWalletBalance: boolean;
  hasCollateral: boolean;
  hasDebt: boolean;
};

export const useLendingPool = () => {
  const [txHash, setTxHash] = useState<Hash | undefined>();
  const [actionError, setActionError] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending: isWriting } = useWriteContract();

  const walletTokenBalanceQuery = useReadContracts({
    contracts: env.supportedTokens.map((token) => ({
      address: token.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address ?? zeroAddress],
      chainId: env.chainId,
    })),
    query: { enabled: Boolean(address) && hasSupportedTokens },
  });

  const poolLiquidityQuery = useReadContracts({
    contracts: env.supportedTokens.map((token) => ({
      address: env.lendingPoolAddress,
      abi: lendingPoolAbi,
      functionName: "getPoolLiquidity",
      args: [token.address],
      chainId: env.chainId,
    })),
    query: { enabled: hasValidLendingPoolAddress && hasSupportedTokens },
  });

  const userPositionQuery = useReadContracts({
    contracts: env.supportedTokens.map((token) => ({
      address: env.lendingPoolAddress,
      abi: lendingPoolAbi,
      functionName: "getUserPosition",
      args: [address ?? zeroAddress, token.address],
      chainId: env.chainId,
    })),
    query: {
      enabled: hasValidLendingPoolAddress && Boolean(address) && hasSupportedTokens,
    },
  });

  const txReceipt = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: Boolean(txHash) },
  });

  useEffect(() => {
    if (txReceipt.isSuccess) {
      void walletTokenBalanceQuery.refetch();
      void poolLiquidityQuery.refetch();
      void userPositionQuery.refetch();
    }
  }, [
    txReceipt.isSuccess,
    walletTokenBalanceQuery,
    poolLiquidityQuery,
    userPositionQuery,
  ]);

  const executeAction = async (
    action: LendingAction,
    token: LendingToken,
    amountInput: string,
  ): Promise<boolean> => {
    setActionError(null);

    if (!isConnected || !address) {
      setActionError("Connect your wallet first.");
      return false;
    }

    if (!hasValidLendingPoolAddress) {
      setActionError("Set NEXT_PUBLIC_LENDING_POOL_ADDRESS in your env.");
      return false;
    }

    if (!token.address || token.address === zeroAddress) {
      setActionError("Select a valid asset token first.");
      return false;
    }

    const normalized = amountInput.trim();
    const amount = Number(normalized);
    if (!normalized || Number.isNaN(amount) || amount <= 0) {
      setActionError("Enter a valid amount greater than zero.");
      return false;
    }

    try {
      const value = parseUnits(normalized, token.decimals);
      const hash = await writeContractAsync({
        address: env.lendingPoolAddress,
        abi: lendingPoolAbi,
        functionName: actionToFunctionName[action],
        args: [token.address, value],
        chainId: env.chainId,
      });
      setTxHash(hash);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : `Transaction failed for ${token.symbol}.`;
      setActionError(message);
      return false;
    }
  };

  const tokenMarkets = useMemo<TokenMarket[]>(() => {
    return env.supportedTokens.map((token, index) => {
      const walletBalanceResult = walletTokenBalanceQuery.data?.[index];
      const poolLiquidityResult = poolLiquidityQuery.data?.[index];
      const positionResult = userPositionQuery.data?.[index];

      const walletBalanceRaw =
        walletBalanceResult?.status === "success"
          ? (walletBalanceResult.result as bigint | undefined)
          : undefined;

      const poolLiquidityRaw =
        poolLiquidityResult?.status === "success"
          ? (poolLiquidityResult.result as bigint | undefined)
          : undefined;

      const positionRaw =
        positionResult?.status === "success"
          ? (positionResult.result as readonly [bigint, bigint] | undefined)
          : undefined;

      const collateralRaw = positionRaw?.[0];
      const debtRaw = positionRaw?.[1];

      return {
        ...token,
        walletBalance: formatTokenAmount(walletBalanceRaw, token.decimals),
        poolLiquidity: formatTokenAmount(poolLiquidityRaw, token.decimals),
        collateral: formatTokenAmount(collateralRaw, token.decimals),
        debt: formatTokenAmount(debtRaw, token.decimals),
        hasWalletBalance: (walletBalanceRaw ?? BIGINT_ZERO) > BIGINT_ZERO,
        hasCollateral: (collateralRaw ?? BIGINT_ZERO) > BIGINT_ZERO,
        hasDebt: (debtRaw ?? BIGINT_ZERO) > BIGINT_ZERO,
      };
    });
  }, [
    walletTokenBalanceQuery.data,
    poolLiquidityQuery.data,
    userPositionQuery.data,
  ]);

  const summary = useMemo(
    () => ({
      supportedAssets: String(tokenMarkets.length),
      walletAssetCount: String(tokenMarkets.filter((token) => token.hasWalletBalance).length),
      collateralMarkets: String(tokenMarkets.filter((token) => token.hasCollateral).length),
      debtMarkets: String(tokenMarkets.filter((token) => token.hasDebt).length),
    }),
    [tokenMarkets],
  );

  const isLoading = isWriting || txReceipt.isLoading;

  return {
    address,
    isConnected,
    txHash,
    txStatus: txReceipt.status,
    actionError,
    isLoading,
    tokenMarkets,
    summary,
    executeAction,
  };
};

