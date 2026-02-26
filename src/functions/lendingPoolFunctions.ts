import {
  erc20Abi,
  type Address,
  type Hash,
  type PublicClient,
  type WalletClient,
} from "viem";
import { lendingPoolAbi } from "@/contracts/lendingPool";

export type LendingPoolCallContext = {
  account: Address;
  lendingPoolAddress: Address;
  publicClient: PublicClient;
  walletClient: WalletClient;
};

export type AssetAmountParams = {
  asset: Address;
  amount: bigint;
};

export type WithdrawParams = {
  asset: Address;
  aTokenAmount: bigint;
};

export type BorrowParams = {
  collateralAsset: Address;
  borrowAsset: Address;
  collateralAmount: bigint;
  borrowAmount: bigint;
};

export type RepayParams = {
  loanId: bigint;
  repayAddress: Address;
  repayAmount: bigint;
};

const BIGINT_ZERO = BigInt(0);

const requirePositiveAmount = (value: bigint, field: string) => {
  if (value <= BIGINT_ZERO) {
    throw new Error(`${field} must be greater than zero.`);
  }
};

const allowLendingPoolSpending = async (
  context: LendingPoolCallContext,
  token: Address,
  amount: bigint,
): Promise<Hash | null> => {
  const allowance = await context.publicClient.readContract({
    address: token,
    abi: erc20Abi,
    functionName: "allowance",
    args: [context.account, context.lendingPoolAddress],
  });

  if (allowance >= amount) {
    return null;
  }

  const approveHash = await context.walletClient.writeContract({
    account: context.account,
    chain: undefined,
    address: token,
    abi: erc20Abi,
    functionName: "approve",
    args: [context.lendingPoolAddress, amount],
  });

  await context.publicClient.waitForTransactionReceipt({ hash: approveHash });
  return approveHash;
};

export const deposit = async (
  context: LendingPoolCallContext,
  params: AssetAmountParams,
): Promise<Hash> => {
  requirePositiveAmount(params.amount, "amount");
  await allowLendingPoolSpending(context, params.asset, params.amount);

  return context.walletClient.writeContract({
    account: context.account,
    chain: undefined,
    address: context.lendingPoolAddress,
    abi: lendingPoolAbi,
    functionName: "deposit",
    args: [params.asset, params.amount],
  });
};

export const withdraw = async (
  context: LendingPoolCallContext,
  params: WithdrawParams,
): Promise<Hash> => {
  requirePositiveAmount(params.aTokenAmount, "aTokenAmount");

  return context.walletClient.writeContract({
    account: context.account,
    chain: undefined,
    address: context.lendingPoolAddress,
    abi: lendingPoolAbi,
    functionName: "withdraw",
    args: [params.asset, params.aTokenAmount],
  });
};

export const borrow = async (
  context: LendingPoolCallContext,
  params: BorrowParams,
): Promise<Hash> => {
  requirePositiveAmount(params.collateralAmount, "collateralAmount");
  requirePositiveAmount(params.borrowAmount, "borrowAmount");
  await allowLendingPoolSpending(
    context,
    params.collateralAsset,
    params.collateralAmount,
  );

  return context.walletClient.writeContract({
    account: context.account,
    chain: undefined,
    address: context.lendingPoolAddress,
    abi: lendingPoolAbi,
    functionName: "borrow",
    args: [
      params.collateralAsset,
      params.borrowAsset,
      params.collateralAmount,
      params.borrowAmount,
    ],
  });
};

export const repay = async (
  context: LendingPoolCallContext,
  params: RepayParams,
): Promise<Hash> => {
  requirePositiveAmount(params.repayAmount, "repayAmount");
  await allowLendingPoolSpending(
    context,
    params.repayAddress,
    params.repayAmount,
  );

  return context.walletClient.writeContract({
    account: context.account,
    chain: undefined,
    address: context.lendingPoolAddress,
    abi: lendingPoolAbi,
    functionName: "repay",
    args: [params.loanId, params.repayAmount],
  });
};
