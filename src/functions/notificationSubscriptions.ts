import type { Address } from "viem";
import { env } from "@/config/env";

export type BorrowNotificationSubscriptionPayload = {
  walletAddress: Address;
  email: string;
  loanId: string;
};

const resolveErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as {
      message?: string;
      error?: string;
    } | null;

    const message = data?.message ?? data?.error;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  } catch {
    // Fall back to status text when response has no JSON body.
  }

  return `Subscription request failed with status ${response.status}.`;
};

export const saveBorrowNotificationSubscription = async (
  payload: BorrowNotificationSubscriptionPayload,
): Promise<void> => {
  const endpoint = env.notificationSubscriptionUrl.trim();
  if (!endpoint) {
    throw new Error(
      "Set NEXT_PUBLIC_NOTIFICATION_SUBSCRIPTION_URL to save notification subscriptions.",
    );
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await resolveErrorMessage(response));
  }
};
