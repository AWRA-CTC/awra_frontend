"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { walletActions, parseUnits, type Hash } from "viem";
import {
  useAccount,
  useChainId,
  useConnectorClient,
  useWaitForTransactionReceipt,
  useWalletClient,
} from "wagmi";
import { AppHeader } from "app/components/layout/AppHeader";
import { Button } from "app/components/ui/Button";
import { NumberInput } from "app/components/ui/NumberInput";
import { env, hasMintableTokens } from "@/config/env";
import { truncate } from "@/functions/formats";
import type { LendingToken } from "@/types/lending";

const MAX_MINT_AMOUNT = "10000";
const BIGINT_ZERO = BigInt(0);

const mintableErc20Abi = [
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "mint",
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    outputs: [],
  },
] as const;

const parsePositiveUnits = (input: string, decimals: number): bigint | null => {
  const normalized = input.trim();
  if (!normalized) return null;

  const amount = Number(normalized);
  if (Number.isNaN(amount) || amount <= 0) return null;

  try {
    const parsed = parseUnits(normalized, decimals);
    if (parsed <= BIGINT_ZERO) return null;
    return parsed;
  } catch {
    return null;
  }
};

export default function TestnetTokensPage() {
  const [selectedToken, setSelectedToken] = useState<LendingToken | null>(null);
  const [mintAmountInput, setMintAmountInput] = useState("");
  const [txHash, setTxHash] = useState<Hash | undefined>();
  const [isAwaitingResult, setIsAwaitingResult] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { address, isConnected } = useAccount();
  const activeChainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const { data: connectorClient } = useConnectorClient();

  const txReceipt = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: Boolean(txHash) },
  });

  const modalStatus = useMemo(() => {
    if (!isAwaitingResult) return null;

    if (txReceipt.status === "success") {
      return {
        tone: "success" as const,
        message: "Mint successful. Closing modal...",
      };
    }

    if (txReceipt.status === "error") {
      return {
        tone: "error" as const,
        message: "Mint transaction failed. Closing modal...",
      };
    }

    return {
      tone: "processing" as const,
      message: "Processing mint transaction...",
    };
  }, [isAwaitingResult, txReceipt.status]);

  const selectedTokenMaxRaw = useMemo(() => {
    if (!selectedToken) return null;
    return parseUnits(MAX_MINT_AMOUNT, selectedToken.decimals);
  }, [selectedToken]);

  const parsedMintAmount = useMemo(() => {
    if (!selectedToken) return null;
    return parsePositiveUnits(mintAmountInput, selectedToken.decimals);
  }, [mintAmountInput, selectedToken]);

  const validationError = useMemo(() => {
    if (!selectedToken || !mintAmountInput.trim()) return null;
    if (parsedMintAmount === null) {
      return "Enter a valid amount greater than zero.";
    }

    if (selectedTokenMaxRaw && parsedMintAmount > selectedTokenMaxRaw) {
      return `Maximum mint amount is ${MAX_MINT_AMOUNT} ${selectedToken.symbol}.`;
    }

    return null;
  }, [mintAmountInput, parsedMintAmount, selectedToken, selectedTokenMaxRaw]);

  const closeModal = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setSelectedToken(null);
    setMintAmountInput("");
    setSubmitError(null);
    setTxHash(undefined);
    setIsAwaitingResult(false);
  };

  useEffect(() => {
    if (!selectedToken || !isAwaitingResult) return;
    if (txReceipt.status !== "success" && txReceipt.status !== "error") return;

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    const delay = txReceipt.status === "success" ? 1200 : 1800;
    closeTimerRef.current = setTimeout(() => {
      closeModal();
    }, delay);
  }, [isAwaitingResult, selectedToken, txReceipt.status]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const isBusy = isAwaitingResult || txReceipt.isLoading;

  const openMintModal = (token: LendingToken) => {
    setSelectedToken(token);
    setMintAmountInput("");
    setSubmitError(null);
    setTxHash(undefined);
    setIsAwaitingResult(false);
  };

  const submitMint = async () => {
    setSubmitError(null);

    if (!selectedToken || !address || !isConnected) {
      setSubmitError("Connect your wallet first.");
      return;
    }

    if (activeChainId !== env.chainId) {
      setSubmitError(`Switch wallet network to chain ID ${env.chainId}.`);
      return;
    }

    if (parsedMintAmount === null) {
      setSubmitError("Enter a valid amount greater than zero.");
      return;
    }

    if (selectedTokenMaxRaw && parsedMintAmount > selectedTokenMaxRaw) {
      setSubmitError(
        `Maximum mint amount is ${MAX_MINT_AMOUNT} ${selectedToken.symbol}.`,
      );
      return;
    }

    const signerClient =
      walletClient ??
      (connectorClient ? connectorClient.extend(walletActions) : undefined);

    if (!signerClient) {
      setSubmitError("Wallet client is not ready yet. Try again.");
      return;
    }

    try {
      const hash = await signerClient.writeContract({
        account: address,
        chain: undefined,
        address: selectedToken.address,
        abi: mintableErc20Abi,
        functionName: "mint",
        args: [address, parsedMintAmount],
      });

      setTxHash(hash);
      setIsAwaitingResult(true);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Mint transaction failed.";
      setSubmitError(message);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <div className="grid gap-5">
        <AppHeader />

        <section className="card p-5 sm:p-6">
          <p className="kicker">Testnet Faucet</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Mint Testnet ERC20 Tokens
          </h2>
          <p className="subtle mt-3 max-w-3xl text-sm leading-relaxed">
            Each mint request is capped at {MAX_MINT_AMOUNT} tokens.
          </p>
        </section>

        {!hasMintableTokens ? (
          <section className="card-flat border-amber-300/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Set <code>NEXT_PUBLIC_MINTABLE_TOKENS</code> in your env file to
            configure mintable tokens.
          </section>
        ) : (
          <section className="card-flat p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="section-title text-white">Mintable Tokens</h3>
              <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-slate-200">
                {env.mintableTokens.length} configured
              </span>
            </div>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-[760px] w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.12em] text-slate-300">
                      Token
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.12em] text-slate-300">
                      Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.12em] text-slate-300">
                      Decimals
                    </th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-[0.12em] text-slate-300">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {env.mintableTokens.map((token, index) => (
                    <tr
                      key={token.address}
                      className={
                        index < env.mintableTokens.length - 1
                          ? "border-b border-white/10"
                          : ""
                      }
                    >
                      <td className="px-4 py-4 align-middle">
                        <p className="text-sm font-semibold text-white">
                          {token.symbol}
                        </p>
                        <p className="subtle max-w-[220px] truncate text-xs">
                          {token.name}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <span className="font-mono text-xs text-slate-200">
                          {truncate(token.address)}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <span className="text-sm text-white">
                          {token.decimals}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-middle text-right">
                        <Button
                          size="sm"
                          disabled={isBusy}
                          onClick={() => openMintModal(token)}
                        >
                          Mint
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {selectedToken ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 backdrop-blur-sm sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="Close mint modal overlay"
            className="absolute inset-0 cursor-default"
            onClick={closeModal}
          />

          <section className="card-flat relative z-10 w-full max-w-md p-5 sm:p-6">
            <p className="kicker">Mint Token</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">
              Mint {selectedToken.symbol}
            </h3>
            <p className="subtle mt-2 text-sm leading-relaxed">
              You can mint up to {MAX_MINT_AMOUNT} {selectedToken.symbol} per
              transaction.
            </p>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm">
              <p className="subtle">Token</p>
              <p className="mt-1 font-medium text-white">
                {selectedToken.name} ({selectedToken.symbol})
              </p>
            </div>

            <div className="mt-4">
              <NumberInput
                label={`Amount (${selectedToken.symbol})`}
                placeholder="0.00"
                value={mintAmountInput}
                onChange={(event) => setMintAmountInput(event.target.value)}
              />
            </div>

            {validationError ? (
              <p className="mt-3 text-sm text-rose-300">{validationError}</p>
            ) : null}
            {modalStatus ? (
              <p
                className={`mt-3 text-sm ${
                  modalStatus.tone === "success"
                    ? "text-emerald-300"
                    : modalStatus.tone === "error"
                      ? "text-rose-300"
                      : "text-sky-200"
                }`}
              >
                {modalStatus.message}
              </p>
            ) : null}
            {submitError ? (
              <p className="mt-3 text-sm text-rose-300">{submitError}</p>
            ) : null}

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={isBusy}
                onClick={closeModal}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={
                  isBusy || !mintAmountInput.trim() || Boolean(validationError)
                }
                onClick={submitMint}
              >
                {isBusy ? "Submitting..." : "Mint"}
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
