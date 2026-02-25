import type { Address } from "viem";

export type LendingAction = "deposit" | "borrow" | "repay" | "withdraw";

export type LendingToken = {
  symbol: string;
  name: string;
  address: Address;
  decimals: number;
};
