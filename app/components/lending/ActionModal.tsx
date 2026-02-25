"use client";

import { useMemo, useState } from "react";
import { Button } from "app/components/ui/Button";
import { NumberInput } from "app/components/ui/NumberInput";
import type { LendingAction, LendingToken } from "@/types/lending";

type ActionModalProps = {
  isOpen: boolean;
  action: LendingAction | null;
  token: LendingToken | null;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (amount: string) => Promise<void>;
};

const actionLabel: Record<LendingAction, string> = {
  deposit: "Supply",
  borrow: "Borrow",
  repay: "Repay",
  withdraw: "Withdraw",
};

const actionDescription: Record<LendingAction, string> = {
  deposit: "Supply this asset into the pool to increase your borrowing capacity.",
  borrow: "Borrow this asset against your existing collateral.",
  repay: "Repay this borrowed asset to reduce your debt.",
  withdraw: "Withdraw supplied collateral while maintaining a healthy position.",
};

export const ActionModal = ({
  isOpen,
  action,
  token,
  busy,
  error,
  onClose,
  onConfirm,
}: ActionModalProps) => {
  const [amount, setAmount] = useState("");

  const title = useMemo(() => {
    if (!action || !token) return "Action";
    return `${actionLabel[action]} ${token.symbol}`;
  }, [action, token]);

  if (!isOpen || !action || !token) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 backdrop-blur-sm sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close action modal overlay"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <section className="card-flat relative z-10 w-full max-w-md p-5 sm:p-6">
        <p className="kicker">{actionLabel[action]} Position</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">{title}</h3>
        <p className="subtle mt-2 text-sm leading-relaxed">
          {actionDescription[action]}
        </p>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm">
          <p className="subtle">Asset</p>
          <p className="mt-1 font-medium text-white">
            {token.name} ({token.symbol})
          </p>
        </div>

        <div className="mt-4">
          <NumberInput
            label={`Amount (${token.symbol})`}
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>

        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={busy || !amount.trim()}
            onClick={async () => {
              await onConfirm(amount);
            }}
          >
            {busy ? "Submitting..." : actionLabel[action]}
          </Button>
        </div>
      </section>
    </div>
  );
};
