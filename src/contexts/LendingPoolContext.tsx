"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAccount, usePublicClient } from "wagmi";
import { erc20Abi, type Address } from "viem";
import {
  env,
  hasSupportedTokens,
  hasValidLendingPoolAddress,
} from "@/config/env";
import { lendingPoolAbi } from "@/contracts/lendingPool";
import type { LendingToken } from "@/types/lending";

type AssetConfigResult = readonly [
  boolean,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  Address,
  boolean,
  boolean,
];

type LoanResult = readonly [
  Address,
  Address,
  Address,
  bigint,
  bigint,
  bigint,
  bigint,
  boolean,
];

export type AssetConfigData = LendingToken & {
  isActive: boolean;
  collateralRatio: bigint;
  liquidationRatio: bigint;
  baseAPR: bigint;
  aprFloor: bigint;
  liquidationBonus: bigint;
  lendToken: Address;
  canBeCollateral: boolean;
  canBeBorrowed: boolean;
};

export type LendTokenBalance = {
  asset: Address;
  assetSymbol: string;
  lendToken: Address;
  balance: bigint;
  hasBalance: boolean;
};

export type UserLoanData = {
  loanId: bigint;
  borrower: Address;
  collateralAsset: Address;
  borrowAsset: Address;
  principal: bigint;
  collateral: bigint;
  apr: bigint;
  startTime: bigint;
  active: boolean;
};

type LendingPoolContextValue = {
  supportedTokens: LendingToken[];
  assetConfigs: AssetConfigData[];
  lendTokenBalances: LendTokenBalance[];
  userDeposits: LendTokenBalance[];
  userLoanIds: bigint[];
  userLoans: UserLoanData[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const LendingPoolContext = createContext<LendingPoolContextValue | undefined>(
  undefined,
);

const BIGINT_ZERO = BigInt(0);

type LendingPoolProviderProps = {
  children: React.ReactNode;
};

export const LendingPoolProvider = ({ children }: LendingPoolProviderProps) => {
  const publicClient = usePublicClient({ chainId: env.chainId });
  const { address } = useAccount();
  const requestIdRef = useRef(0);

  const [assetConfigs, setAssetConfigs] = useState<AssetConfigData[]>([]);
  const [lendTokenBalances, setLendTokenBalances] = useState<LendTokenBalance[]>(
    [],
  );
  const [userLoanIds, setUserLoanIds] = useState<bigint[]>([]);
  const [userLoans, setUserLoans] = useState<UserLoanData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!publicClient || !hasValidLendingPoolAddress || !hasSupportedTokens) {
      setAssetConfigs([]);
      setLendTokenBalances([]);
      setUserLoanIds([]);
      setUserLoans([]);
      setError(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const nextAssetConfigs: AssetConfigData[] = [];

      for (const token of env.supportedTokens) {
        const config = (await publicClient.readContract({
          address: env.lendingPoolAddress,
          abi: lendingPoolAbi,
          functionName: "assetConfigs",
          args: [token.address],
        })) as AssetConfigResult;

        nextAssetConfigs.push({
          ...token,
          isActive: config[0],
          collateralRatio: config[1],
          liquidationRatio: config[2],
          baseAPR: config[3],
          aprFloor: config[4],
          liquidationBonus: config[5],
          lendToken: config[6],
          canBeCollateral: config[7],
          canBeBorrowed: config[8],
        });
      }

      if (requestId !== requestIdRef.current) return;
      setAssetConfigs(nextAssetConfigs);

      if (!address) {
        setLendTokenBalances([]);
        setUserLoanIds([]);
        setUserLoans([]);
        return;
      }

      const nextLendTokenBalances: LendTokenBalance[] = [];

      for (const config of nextAssetConfigs) {
        const balance = await publicClient.readContract({
          address: config.lendToken,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address],
        });

        nextLendTokenBalances.push({
          asset: config.address,
          assetSymbol: config.symbol,
          lendToken: config.lendToken,
          balance,
          hasBalance: balance > BIGINT_ZERO,
        });
      }

      if (requestId !== requestIdRef.current) return;
      setLendTokenBalances(nextLendTokenBalances);

      const loanIds = (await publicClient.readContract({
        address: env.lendingPoolAddress,
        abi: lendingPoolAbi,
        functionName: "getUserLoanIds",
        args: [address],
      })) as bigint[];

      if (requestId !== requestIdRef.current) return;
      setUserLoanIds(loanIds);

      const nextLoans: UserLoanData[] = [];
      for (const loanId of loanIds) {
        const loan = (await publicClient.readContract({
          address: env.lendingPoolAddress,
          abi: lendingPoolAbi,
          functionName: "loans",
          args: [loanId],
        })) as LoanResult;

        nextLoans.push({
          loanId,
          borrower: loan[0],
          collateralAsset: loan[1],
          borrowAsset: loan[2],
          principal: loan[3],
          collateral: loan[4],
          apr: loan[5],
          startTime: loan[6],
          active: loan[7],
        });
      }

      if (requestId !== requestIdRef.current) return;
      setUserLoans(nextLoans);
    } catch (cause) {
      if (requestId !== requestIdRef.current) return;
      const message =
        cause instanceof Error
          ? cause.message
          : "Failed to fetch lending pool user data.";
      setError(message);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [address, publicClient]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const userDeposits = useMemo(
    () => lendTokenBalances.filter((item) => item.hasBalance),
    [lendTokenBalances],
  );

  const value = useMemo<LendingPoolContextValue>(
    () => ({
      supportedTokens: env.supportedTokens,
      assetConfigs,
      lendTokenBalances,
      userDeposits,
      userLoanIds,
      userLoans,
      isLoading,
      error,
      refresh,
    }),
    [
      assetConfigs,
      lendTokenBalances,
      userDeposits,
      userLoanIds,
      userLoans,
      isLoading,
      error,
      refresh,
    ],
  );

  return (
    <LendingPoolContext.Provider value={value}>
      {children}
    </LendingPoolContext.Provider>
  );
};

export const useLendingPoolContext = () => {
  const context = useContext(LendingPoolContext);
  if (!context) {
    throw new Error(
      "useLendingPoolContext must be used inside LendingPoolProvider.",
    );
  }

  return context;
};
