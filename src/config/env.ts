import { type Address, zeroAddress } from "viem";
import type { LendingToken } from "@/types/lending";

const parseAddress = (value: string | undefined): Address => {
  if (value && /^0x[a-fA-F0-9]{40}$/.test(value)) {
    return value as Address;
  }

  return zeroAddress;
};

const parseSupportedTokens = (value: string | undefined): LendingToken[] => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];

    const seen = new Set<string>();

    return parsed.flatMap((item) => {
      if (typeof item !== "object" || item === null) return [];

      const token = item as Partial<LendingToken>;
      const symbol = token.symbol?.trim();
      const name = token.name?.trim();
      const address = token.address?.trim();
      const decimals = Number(token.decimals);

      if (
        !symbol ||
        !name ||
        !address ||
        !/^0x[a-fA-F0-9]{40}$/.test(address)
      ) {
        return [];
      }

      if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
        return [];
      }

      const dedupeKey = `${symbol.toLowerCase()}:${address.toLowerCase()}`;
      if (seen.has(dedupeKey)) return [];
      seen.add(dedupeKey);

      return [
        {
          symbol,
          name,
          address: address as Address,
          decimals,
        },
      ];
    });
  } catch {
    return [];
  }
};

const chainIdValue = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "11155111");

export const env = {
  chainId: Number.isNaN(chainIdValue) ? 11155111 : chainIdValue,
  lendingPoolAddress: parseAddress(
    process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS,
  ),
  walletConnectProjectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
  testnetRpcUrl:
    process.env.NEXT_PUBLIC_CTC_TESTNET_RPC_URL ??
    "wss://rpc.cc3-testnet.creditcoin.network",
  supportedTokens: parseSupportedTokens(
    process.env.NEXT_PUBLIC_SUPPORTED_TOKENS,
  ),
} as const;

export const hasValidLendingPoolAddress =
  env.lendingPoolAddress !== zeroAddress;
export const hasWalletConnectProjectId =
  env.walletConnectProjectId.trim().length > 0;
export const hasSupportedTokens = env.supportedTokens.length > 0;
