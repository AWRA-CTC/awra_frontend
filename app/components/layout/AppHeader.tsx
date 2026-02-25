import Image from "next/image";
import { WalletConnectButton } from "app/components/wallet/WalletConnectButton";

export const AppHeader = () => {
  return (
    <header className="card-flat px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-rose-200/30 bg-black/65 shadow-[0_0_0_1px_rgba(255,58,70,0.24),0_0_26px_rgba(255,58,70,0.28)]">
            <Image
              src="/logo.jpg"
              alt="AWRA logo"
              fill
              sizes="56px"
              className="object-cover"
              priority
            />
          </div>
          <div>
            <p className="kicker">AWRA LABS</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
              Testnet
            </h1>
          </div>
        </div>
        <WalletConnectButton />
      </div>
      <p className="subtle mt-4 max-w-3xl text-sm leading-relaxed">
        AWRA is a credit-aware decentralized lending protocol built on
        Creditcoin.
      </p>
    </header>
  );
};
