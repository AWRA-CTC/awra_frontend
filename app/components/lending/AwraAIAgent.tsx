"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "app/components/ui/Button";
import type {
  AssetConfigData,
  LendTokenBalance,
  UserLoanData,
} from "@/contexts/LendingPoolContext";
import {
  formatAprFromBasisPoints,
  formatTokenAmount,
  truncate,
} from "@/functions/formats";
import { sendAwraAiAgentMessage } from "@/functions/awraAiAgent";
import type { LendingToken } from "@/types/lending";

type AgentRole = "assistant" | "user";

type AgentMessage = {
  id: number;
  role: AgentRole;
  text: string;
};

type LoanSummary = {
  loanId: string;
  borrowAmount: string;
  borrowSymbol: string;
  collateralAmount: string;
  collateralSymbol: string;
  aprText: string;
};

type AwraAIAgentProps = {
  isConnected: boolean;
  walletAddress?: string;
  supportedTokens: LendingToken[];
  userDeposits: LendTokenBalance[];
  userLoans: UserLoanData[];
  assetConfigs: AssetConfigData[];
};

const BIGINT_ZERO = BigInt(0);

const containsAny = (text: string, keywords: string[]) => {
  return keywords.some((keyword) => text.includes(keyword));
};

const joinList = (items: string[]) => {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
};

const INITIAL_MESSAGE =
  "I am AWRA AI Agent. I can explain your supplied tokens, borrowed loans, supported assets, and how the credit-score APR model works.";

export const AwraAIAgent = ({
  isConnected,
  walletAddress,
  supportedTokens,
  userDeposits,
  userLoans,
  assetConfigs,
}: AwraAIAgentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([
    { id: 1, role: "assistant", text: INITIAL_MESSAGE },
  ]);

  const messageIdRef = useRef(2);
  const requestAbortRef = useRef<AbortController | null>(null);
  const messageViewportRef = useRef<HTMLDivElement | null>(null);

  const tokenByAddress = useMemo(() => {
    const index = new Map<string, LendingToken>();
    for (const token of supportedTokens) {
      index.set(token.address.toLowerCase(), token);
    }
    return index;
  }, [supportedTokens]);

  const suppliedSummary = useMemo(() => {
    return userDeposits
      .filter((position) => position.hasBalance)
      .map((position) => {
        const token = tokenByAddress.get(position.asset.toLowerCase());
        const symbol = token?.symbol ?? position.assetSymbol;
        const amount = formatTokenAmount(
          position.balance,
          token?.decimals ?? 18,
        );
        return `${amount} ${symbol}`;
      });
  }, [tokenByAddress, userDeposits]);

  const loanSummaries = useMemo<LoanSummary[]>(() => {
    return userLoans
      .filter((loan) => loan.active && loan.principal > BIGINT_ZERO)
      .map((loan) => {
        const borrowToken = tokenByAddress.get(loan.borrowAsset.toLowerCase());
        const collateralToken = tokenByAddress.get(
          loan.collateralAsset.toLowerCase(),
        );

        return {
          loanId: loan.loanId.toString(),
          borrowAmount: formatTokenAmount(
            loan.principal,
            borrowToken?.decimals ?? 18,
          ),
          borrowSymbol: borrowToken?.symbol ?? truncate(loan.borrowAsset),
          collateralAmount: formatTokenAmount(
            loan.collateral,
            collateralToken?.decimals ?? 18,
          ),
          collateralSymbol:
            collateralToken?.symbol ?? truncate(loan.collateralAsset),
          aprText: formatAprFromBasisPoints(loan.apr),
        };
      });
  }, [tokenByAddress, userLoans]);

  const tokenListSummary = useMemo(() => {
    if (supportedTokens.length === 0)
      return "No supported assets are configured.";
    return joinList(supportedTokens.map((token) => token.symbol));
  }, [supportedTokens]);

  const assetAprSummary = useMemo(() => {
    if (assetConfigs.length === 0) return [];

    return assetConfigs.map((config) => {
      return `${config.symbol}: base ${formatAprFromBasisPoints(config.baseAPR)}, floor ${formatAprFromBasisPoints(config.aprFloor)}`;
    });
  }, [assetConfigs]);

  const assetConfigByAddress = useMemo(() => {
    const index = new Map<string, AssetConfigData>();
    for (const config of assetConfigs) {
      index.set(config.address.toLowerCase(), config);
    }
    return index;
  }, [assetConfigs]);

  const supportedTokenContext = useMemo(() => {
    return supportedTokens.map((token) => {
      const config = assetConfigByAddress.get(token.address.toLowerCase());
      return {
        symbol: token.symbol,
        name: token.name,
        address: token.address,
        decimals: token.decimals,
        canBeCollateral: config?.canBeCollateral ?? false,
        canBeBorrowed: config?.canBeBorrowed ?? false,
        baseAprBps: (config?.baseAPR ?? BIGINT_ZERO).toString(),
        aprFloorBps: (config?.aprFloor ?? BIGINT_ZERO).toString(),
      };
    });
  }, [assetConfigByAddress, supportedTokens]);

  const suppliedTokenContext = useMemo(() => {
    return userDeposits
      .filter((position) => position.hasBalance)
      .map((position) => {
        const token = tokenByAddress.get(position.asset.toLowerCase());
        return {
          symbol: token?.symbol ?? position.assetSymbol,
          assetAddress: position.asset,
          lendTokenAddress: position.lendToken,
          amountRaw: position.balance.toString(),
          amountFormatted: formatTokenAmount(
            position.balance,
            token?.decimals ?? 18,
          ),
        };
      });
  }, [tokenByAddress, userDeposits]);

  const borrowedLoanContext = useMemo(() => {
    return userLoans.map((loan) => {
      const borrowToken = tokenByAddress.get(loan.borrowAsset.toLowerCase());
      const collateralToken = tokenByAddress.get(
        loan.collateralAsset.toLowerCase(),
      );

      return {
        loanId: loan.loanId.toString(),
        borrowSymbol: borrowToken?.symbol ?? truncate(loan.borrowAsset),
        borrowAssetAddress: loan.borrowAsset,
        principalRaw: loan.principal.toString(),
        principalFormatted: formatTokenAmount(
          loan.principal,
          borrowToken?.decimals ?? 18,
        ),
        collateralSymbol:
          collateralToken?.symbol ?? truncate(loan.collateralAsset),
        collateralAssetAddress: loan.collateralAsset,
        collateralRaw: loan.collateral.toString(),
        collateralFormatted: formatTokenAmount(
          loan.collateral,
          collateralToken?.decimals ?? 18,
        ),
        aprBps: loan.apr.toString(),
        aprPercent: formatAprFromBasisPoints(loan.apr),
        active: loan.active,
      };
    });
  }, [tokenByAddress, userLoans]);

  const buildReply = useCallback(
    (question: string) => {
      const normalized = question.toLowerCase();

      const asksSupply = containsAny(normalized, [
        "supply",
        "supplied",
        "deposit",
        "collateral",
      ]);
      const asksBorrow = containsAny(normalized, [
        "borrow",
        "borrowed",
        "loan",
        "debt",
        "repay",
      ]);
      const asksTokenList = containsAny(normalized, [
        "token",
        "asset",
        "market",
        "supported",
        "list",
      ]);
      const asksAprModel = containsAny(normalized, [
        "apr",
        "rate",
        "credit",
        "score",
        "interest",
      ]);
      const asksRisk = containsAny(normalized, [
        "risk",
        "liquidation",
        "health",
        "safe",
        "danger",
      ]);
      const asksAboutAwra = containsAny(normalized, [
        "awra",
        "protocol",
        "what is",
        "how does",
      ]);

      if (!isConnected && (asksSupply || asksBorrow)) {
        return "Connect your wallet to load your personalized supplied and borrowed positions. I can still explain supported markets and AWRA model details.";
      }

      if (asksSupply) {
        if (suppliedSummary.length === 0) {
          return "You currently have no supplied positions. Use Supply on a token market row to open collateral positions.";
        }

        return `You currently supplied ${joinList(suppliedSummary)}.`;
      }

      if (asksBorrow) {
        if (loanSummaries.length === 0) {
          return "You currently have no active borrowed loans.";
        }

        const loanDetails = loanSummaries.map((loan) => {
          return `Loan ${loan.loanId}: borrowed ${loan.borrowAmount} ${loan.borrowSymbol} against ${loan.collateralAmount} ${loan.collateralSymbol} at ${loan.aprText} APR`;
        });
        return loanDetails.join(". ");
      }

      if (asksTokenList) {
        if (supportedTokens.length === 0) {
          return "No token markets are configured yet. Set NEXT_PUBLIC_SUPPORTED_TOKENS in env to enable markets.";
        }

        const capabilityDetails = assetConfigs
          .map((config) => {
            const collateral = config.canBeCollateral
              ? "collateral"
              : "no collateral";
            const borrow = config.canBeBorrowed
              ? "borrowable"
              : "not borrowable";
            return `${config.symbol} (${collateral}, ${borrow})`;
          })
          .join(", ");

        if (!capabilityDetails) {
          return `Supported assets are ${tokenListSummary}.`;
        }

        return `Supported assets are ${tokenListSummary}. Market config: ${capabilityDetails}.`;
      }

      if (asksAprModel) {
        const aprContext =
          assetAprSummary.length > 0
            ? `Asset APR parameters: ${assetAprSummary.join("; ")}.`
            : "Asset APR parameters are still loading.";

        const activeAprs =
          loanSummaries.length > 0
            ? `Your active loan APRs: ${loanSummaries
                .map((loan) => `Loan ${loan.loanId} at ${loan.aprText}`)
                .join(", ")}.`
            : "You have no active loans right now.";

        return `AWRA uses a credit-aware APR model where borrower behavior (repayment consistency, utilization, and risk profile) influences borrowing rate around each asset's base APR and floor. ${aprContext} ${activeAprs}`;
      }

      if (asksRisk) {
        return "AWRA follows overcollateralized lending and monitors liquidation risk. A practical health check is healthFactor = (collateralValue * liquidationThreshold) / debtValue. Keep collateral buffers and repay early when your debt grows or collateral value drops.";
      }

      if (asksAboutAwra) {
        return "AWRA is an overcollateralized lending protocol on Creditcoin with credit-aware APR and AI risk monitoring. Users supply collateral, borrow supported assets, and receive proactive risk guidance before liquidation pressure increases.";
      }

      if (!isConnected) {
        return `I can answer protocol and market questions. Connect your wallet for personalized position guidance. Supported assets now: ${tokenListSummary}.`;
      }

      const depositText =
        suppliedSummary.length > 0
          ? `Supplied: ${joinList(suppliedSummary)}.`
          : "Supplied: none.";
      const loanText =
        loanSummaries.length > 0
          ? `Borrowed loans: ${loanSummaries.length} active.`
          : "Borrowed loans: none.";

      return `${depositText} ${loanText} Ask about tokens, credit-score APR, or liquidation risk for deeper guidance.`;
    },
    [
      assetAprSummary,
      assetConfigs,
      isConnected,
      loanSummaries,
      suppliedSummary,
      supportedTokens.length,
      tokenListSummary,
    ],
  );

  const appendMessage = useCallback((role: AgentRole, text: string) => {
    const nextId = messageIdRef.current++;
    setMessages((previous) => [...previous, { id: nextId, role, text }]);
  }, []);

  const submitMessage = useCallback(
    (rawInput: string) => {
      const input = rawInput.trim();
      if (!input || isResponding) return;

      const history = [
        ...messages,
        { id: -1, role: "user" as const, text: input },
      ]
        .slice(-12)
        .map((item) => ({
          role: item.role,
          content: item.text,
        }));

      appendMessage("user", input);
      setIsResponding(true);
      setDraft("");

      if (requestAbortRef.current) {
        requestAbortRef.current.abort();
      }

      const controller = new AbortController();
      requestAbortRef.current = controller;

      const payload = {
        message: input,
        history,
        wallet: {
          isConnected,
          address: walletAddress ?? null,
        },
        context: {
          suppliedTokens: suppliedTokenContext,
          borrowedLoans: borrowedLoanContext,
          supportedTokens: supportedTokenContext,
          protocol: {
            name: "AWRA" as const,
            chain: "Creditcoin" as const,
            lendingModel: "Overcollateralized lending" as const,
            aprModel:
              "Credit-aware APR where borrower quality can influence borrowing rate around asset base APR and APR floor." as const,
          },
        },
      };

      void (async () => {
        try {
          const reply = await sendAwraAiAgentMessage(
            payload,
            controller.signal,
          );
          appendMessage("assistant", reply);
        } catch (cause) {
          if (controller.signal.aborted) return;

          const fallbackReply = buildReply(input);
          const message =
            cause instanceof Error
              ? cause.message
              : "Backend AI request failed.";

          appendMessage(
            "assistant",
            `${fallbackReply}\n\n(Backend AI unavailable: ${message})`,
          );
        } finally {
          if (requestAbortRef.current === controller) {
            requestAbortRef.current = null;
          }
          if (!controller.signal.aborted) {
            setIsResponding(false);
          }
        }
      })();
    },
    [
      appendMessage,
      borrowedLoanContext,
      buildReply,
      isConnected,
      isResponding,
      messages,
      suppliedTokenContext,
      supportedTokenContext,
      walletAddress,
    ],
  );

  useEffect(() => {
    if (!isOpen) return;
    const viewport = messageViewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
  }, [isOpen, messages, isResponding]);

  useEffect(() => {
    return () => {
      if (requestAbortRef.current) {
        requestAbortRef.current.abort();
        requestAbortRef.current = null;
      }
    };
  }, []);

  const quickPrompts = [
    "What have I supplied?",
    "What are my active loans?",
    "Which tokens are supported?",
    "How does credit score affect APR?",
  ];

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-4 z-[40] h-48 items-center gap-2  px-4 text-sm font-medium text-white  transition hover:cursor-pointer hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:bottom-6 sm:right-6"
        aria-label="Open AWRA AI Agent"
      >
        <div
          className="relative mx-auto aspect-square w-full"
          style={{ perspective: "1000px" }}
        >
          <Image
            src="/icon.png"
            alt="AWRA logo"
            fill
            sizes="(min-width: 512px) 320px, (min-width: 512px) 280px, 72vw"
            className="awra-logo-glow object-contain spin-3d"
            priority
          />
        </div>
        <div className="shadow-[0_14px_34px_rgba(255,58,70,0.35)]">
          AI agent
        </div>
      </button>
    );
  }

  return (
    <section className="fixed bottom-4 right-2 z-[40] flex h-[min(76vh,620px)] w-[min(420px,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl border border-white/18 bg-[linear-gradient(165deg,rgba(12,16,20,0.96),rgba(12,16,20,0.88))] shadow-[0_24px_70px_rgba(0,0,0,0.55)] sm:bottom-6 sm:right-6">
      <header className="flex items-start justify-between border-b border-white/12 px-4 py-3">
        <div>
          <p className="kicker">AWRA Assistant</p>
          <h3 className="mt-1 text-sm font-semibold text-white">
            AWRA AI Agent
          </h3>
          <p className="mt-1 text-xs text-white/65">
            {isConnected
              ? `Wallet ${truncate(walletAddress ?? "connected", 8, 6)}`
              : "Wallet not connected"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/18 bg-white/6 text-sm text-white transition hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/75 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          aria-label="Close AWRA AI Agent"
        >
          x
        </button>
      </header>

      <div className="border-b border-white/10 px-3 py-2">
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => submitMessage(prompt)}
              disabled={isResponding}
              className="rounded-full border border-white/20 bg-white/6 px-2.5 py-1 text-[11px] text-slate-100 transition hover:border-white/30 hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={messageViewportRef}
        className="flex-1 space-y-2 overflow-y-auto px-3 py-3"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                message.role === "user"
                  ? "border border-rose-300/45 bg-rose-500/20 text-rose-50"
                  : "border border-white/12 bg-black/30 text-slate-100"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        {isResponding ? (
          <div className="flex justify-start">
            <div className="max-w-[90%] rounded-2xl border border-white/12 bg-black/30 px-3 py-2 text-sm text-slate-300">
              Thinking...
            </div>
          </div>
        ) : null}
      </div>

      <form
        className="grid gap-2 border-t border-white/12 px-3 py-3"
        onSubmit={(event) => {
          event.preventDefault();
          submitMessage(draft);
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about your position, tokens, APR, or risk..."
          disabled={isResponding}
          className="h-10 rounded-xl border border-white/18 bg-black/35 px-3 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-rose-300/55 focus:ring-2 focus:ring-rose-300/35 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            type="submit"
            disabled={isResponding || !draft.trim()}
          >
            Send
          </Button>
        </div>
      </form>
    </section>
  );
};
