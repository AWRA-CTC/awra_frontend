import { env } from "@/config/env";

type ChatRole = "assistant" | "user";

export type AwraAiChatHistoryItem = {
  role: ChatRole;
  content: string;
};

export type AwraAiSupportedTokenContext = {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  canBeCollateral: boolean;
  canBeBorrowed: boolean;
  baseAprBps: string;
  aprFloorBps: string;
};

export type AwraAiSuppliedTokenContext = {
  symbol: string;
  assetAddress: string;
  lendTokenAddress: string;
  amountRaw: string;
  amountFormatted: string;
};

export type AwraAiBorrowedLoanContext = {
  loanId: string;
  borrowSymbol: string;
  borrowAssetAddress: string;
  principalRaw: string;
  principalFormatted: string;
  collateralSymbol: string;
  collateralAssetAddress: string;
  collateralRaw: string;
  collateralFormatted: string;
  aprBps: string;
  aprPercent: string;
  active: boolean;
};

export type AwraAiChatPayload = {
  message: string;
  history: AwraAiChatHistoryItem[];
  wallet: {
    isConnected: boolean;
    address: string | null;
  };
  context: {
    suppliedTokens: AwraAiSuppliedTokenContext[];
    borrowedLoans: AwraAiBorrowedLoanContext[];
    supportedTokens: AwraAiSupportedTokenContext[];
    protocol: {
      name: "AWRA";
      chain: "Creditcoin";
      lendingModel: "Overcollateralized lending";
      aprModel: "Credit-aware APR where borrower quality can influence borrowing rate around asset base APR and APR floor.";
    };
  };
};

const resolveErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as {
      message?: string;
      error?: string;
      detail?: string;
    } | null;

    const message = data?.message ?? data?.error ?? data?.detail;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  } catch {
    // Fall back to status text when response has no JSON body.
    console.log(
      "Failed to parse AI error response as JSON, falling back to status text.",
    );
  }

  return `AI request failed with status ${response.status}.`;
};

const parseResponseText = (data: unknown): string | null => {
  if (!data || typeof data !== "object") return null;

  const direct = data as {
    reply?: unknown;
    message?: unknown;
    content?: unknown;
    output?: unknown;
    choices?: unknown;
  };

  const directTextCandidates = [
    direct.reply,
    direct.message,
    direct.content,
    direct.output,
  ];

  for (const candidate of directTextCandidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  if (Array.isArray(direct.choices) && direct.choices.length > 0) {
    const firstChoice = direct.choices[0] as
      | {
          message?: { content?: unknown };
          text?: unknown;
        }
      | undefined;

    const choiceContent = firstChoice?.message?.content;
    if (typeof choiceContent === "string" && choiceContent.trim()) {
      return choiceContent.trim();
    }

    if (typeof firstChoice?.text === "string" && firstChoice.text.trim()) {
      return firstChoice.text.trim();
    }
  }

  return null;
};

export const sendAwraAiAgentMessage = async (
  payload: AwraAiChatPayload,
  signal?: AbortSignal,
): Promise<string> => {
  const endpoint = env.awraAiAgentUrl.trim();
  if (!endpoint) {
    throw new Error(
      "Set NEXT_PUBLIC_AWRA_AI_AGENT_URL to enable backend AI replies.",
    );
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new Error(await resolveErrorMessage(response));
  }

  console.log("Raw AI response:", response);

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.toLowerCase().includes("application/json")) {
    const data = (await response.json()) as unknown;
    console.log("Parsed AI response JSON:", data);

    // Access the nested answer field
    const answer = (data as { data?: { answer?: unknown } })?.data?.answer;
    if (typeof answer === "string" && answer.trim()) {
      return answer.trim();
    }

    // Fallback to parseResponseText for flexibility if direct access fails
    const parsed = parseResponseText(data);
    if (parsed) {
      return parsed;
    }
  }

  const text = (await response.text()).trim();
  if (!text) {
    throw new Error("AI response was empty.");
  }
  return text;
};
