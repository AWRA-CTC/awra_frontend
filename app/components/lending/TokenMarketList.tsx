import { Button } from "app/components/ui/Button";
import type { LendingAction, LendingToken } from "@/types/lending";

type TokenMarketRow = LendingToken & {
  walletBalance: string;
  canBeCollateral: boolean;
  canBeBorrowed: boolean;
};

type TokenMarketListProps = {
  markets: TokenMarketRow[];
  busy: boolean;
  onAction: (action: LendingAction, token: LendingToken) => void;
};

const actionButtonClass = "min-w-[86px]";

export const TokenMarketList = ({
  markets,
  busy,
  onAction,
}: TokenMarketListProps) => {
  if (markets.length === 0) {
    return (
      <section className="card-flat px-4 py-5 text-sm text-slate-200">
        No token markets configured. Add assets in{" "}
        <code>NEXT_PUBLIC_SUPPORTED_TOKENS</code>.
      </section>
    );
  }

  return (
    <section className="card-flat p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="section-title text-white">Token Markets</h3>
        <p className="subtle text-xs sm:text-sm">
          Choose a token row and open a pop-up action form.
        </p>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/25">
        <table className="min-w-[760px] w-full border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.12em] text-slate-300">
                Token
              </th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.12em] text-slate-300">
                Wallet
              </th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.12em] text-slate-300">
                Can Be Collateral
              </th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.12em] text-slate-300">
                Can Be Borrowed
              </th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-[0.12em] text-slate-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {markets.map((market, index) => (
              <tr
                key={market.address}
                className={index < markets.length - 1 ? "border-b border-white/10" : ""}
              >
                <td className="px-4 py-4 align-middle">
                  <p className="text-sm font-semibold text-white">{market.symbol}</p>
                  <p className="subtle max-w-[220px] truncate text-xs">{market.name}</p>
                </td>
                <td className="px-4 py-4 align-middle">
                  <p className="balance-text text-sm text-white">{market.walletBalance}</p>
                </td>
                <td className="px-4 py-4 align-middle">
                  <span
                    className={
                      market.canBeCollateral
                        ? "inline-flex rounded-full border border-emerald-300/45 bg-emerald-400/15 px-2.5 py-1 text-xs text-emerald-100"
                        : "inline-flex rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-xs text-slate-300"
                    }
                  >
                    {market.canBeCollateral ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-4 align-middle">
                  <span
                    className={
                      market.canBeBorrowed
                        ? "inline-flex rounded-full border border-sky-300/45 bg-sky-400/15 px-2.5 py-1 text-xs text-sky-100"
                        : "inline-flex rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-xs text-slate-300"
                    }
                  >
                    {market.canBeBorrowed ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-4 align-middle">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      size="sm"
                      className={actionButtonClass}
                      disabled={busy}
                      onClick={() => onAction("deposit", market)}
                    >
                      Supply
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className={actionButtonClass}
                      disabled={busy}
                      onClick={() => onAction("borrow", market)}
                    >
                      Borrow
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
