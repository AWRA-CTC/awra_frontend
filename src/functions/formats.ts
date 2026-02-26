import { formatUnits } from "viem";

const BIGINT_ZERO = BigInt(0);

export const truncate = (value: string, head = 10, tail = 8) => {
  if (value.length <= head + tail) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
};

export const formatTokenAmount = (value: bigint, decimals = 18) => {
  const amount = Number(formatUnits(value, decimals));
  if (Number.isNaN(amount)) return "0";
  return amount.toLocaleString(undefined, { maximumFractionDigits: 4 });
};

export const formatAprFromBasisPoints = (apr: bigint) => {
  const percent = Number(apr) / 100;
  if (!Number.isFinite(percent)) return `${apr.toString()} bps`;
  return `${percent.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
};

export const formatLoanStart = (timestamp: bigint) => {
  if (timestamp <= BIGINT_ZERO) return "N/A";
  const milliseconds = Number(timestamp) * 1000;
  if (!Number.isFinite(milliseconds)) return "N/A";
  return new Date(milliseconds).toLocaleString();
};
