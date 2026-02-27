import Link from "next/link";
import Image from "next/image";
import { SiteFooter } from "app/components/marketing/SiteFooter";
import { SiteHeader } from "app/components/marketing/SiteHeader";

type IconProps = {
  className?: string;
};

const DynamicAprIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
    className={className}
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M4 18h16" />
    <path d="M6 15.4 10.2 11l3 2.8L18 8.6" />
    <path d="m15 8.6 3-.2-.2 3" />
  </svg>
);

const RiskAgentIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
    className={className}
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M12 3 5 6v6.2c0 4.3 2.9 7.9 7 8.8 4.1-.9 7-4.5 7-8.8V6L12 3Z" />
    <path d="M9.2 12.2 11.1 14l3.7-3.9" />
  </svg>
);

const HealthFactorIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
    className={className}
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M3 12h3l2-4 3 8 2-4h8" />
    <path d="M4 18h16" />
  </svg>
);

const AlertIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
    className={className}
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M6 8.5a6 6 0 1 1 12 0v4.2l1.5 2.3H4.5L6 12.7V8.5Z" />
    <path d="M9.5 18a2.5 2.5 0 0 0 5 0" />
  </svg>
);

const ContractIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
    className={className}
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M8 9h8M8 12h8M8 15h6" />
  </svg>
);

const AssetIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
    className={className}
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <circle cx="8" cy="8" r="3.5" />
    <circle cx="16" cy="16" r="3.5" />
    <path d="M11 10.5 13 13.5" />
    <path d="M13.5 8h5v5" />
    <path d="m18.5 8-7 7" />
  </svg>
);

const features = [
  {
    title: "Dynamic APR Based on Credit Score",
    description:
      "Borrowing APR adjusts with on-chain credit performance, rewarding responsible repayment behavior with lower rates.",
    Icon: DynamicAprIcon,
  },
  {
    title: "AI Risk Monitoring Agent",
    description:
      "AWRA's monitoring agent continuously evaluates collateralization, volatility, and borrower position stress in real time.",
    Icon: RiskAgentIcon,
  },
  {
    title: "Real-Time Health Factor Tracking",
    description:
      "Health factor analytics update as market data changes, helping borrowers understand their liquidation distance at a glance.",
    Icon: HealthFactorIcon,
  },
  {
    title: "Proactive Liquidation Alerts",
    description:
      "Automated risk notifications are sent before critical liquidation thresholds are reached, including email alerts for urgency.",
    Icon: AlertIcon,
  },
  {
    title: "Secure Smart Contracts",
    description:
      "Protocol logic runs through audited-style smart contract architecture with clear collateral and debt accounting guarantees.",
    Icon: ContractIcon,
  },
  {
    title: "Multi-Asset Lending Support",
    description:
      "Borrow and lend across multiple supported assets while AWRA optimizes monitoring across your full portfolio exposure.",
    Icon: AssetIcon,
  },
];

const flowSteps = [
  {
    title: "User",
    description: "Connect wallet and open your AWRA borrowing desk.",
  },
  {
    title: "Deposit",
    description: "Supply collateral assets into the protocol vault.",
  },
  {
    title: "Borrow",
    description: "Borrow supported assets at a credit-adjusted APR.",
  },
  {
    title: "AWRA Agent Monitors",
    description:
      "Risk agent tracks health factor, oracle movements, and volatility.",
  },
  {
    title: "Email Alert if Risk",
    description:
      "Borrowers receive immediate warning alerts before liquidation pressure escalates.",
  },
];

const architectureItems = [
  {
    title: "Credit-Based APR Model",
    body: "AWRA uses borrower credit characteristics to set adaptive rates instead of relying on one-size-fits-all static APR.",
  },
  {
    title: "AI Risk Monitoring Agent",
    body: "An automated agent observes borrower positions continuously and detects risk and alerts borrowers before liquidation windows tighten.",
  },
  {
    title: "Smart Contracts + Oracle Infrastructure",
    body: "Contracts enforce lending logic while oracle feeds provide fresh pricing inputs for robust collateralization decisions.",
  },
];

export default function Home() {
  return (
    <div className="marketing-shell">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden pb-16 pt-20 sm:pb-24 sm:pt-24">
          <div className="awra-hero-backdrop" aria-hidden />
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="max-w-3xl">
              <p className="kicker">Agentic DeFi Lending Protocol</p>
              <h1 className="mt-5 text-5xl font-semibold tracking-tight text-white sm:text-7xl">
                AWRA
              </h1>
              <p className="mt-5 text-xl font-medium text-white/90 sm:text-2xl">
                Agentic DeFi Lending Protocol
              </p>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/72 sm:text-lg">
                AWRA combines credit-based APR with AI-powered risk monitoring
                to proactively protect borrowers from liquidation.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/lending-page"
                  className="inline-flex rounded-xl border border-rose-200/55 bg-rose-500/18 px-5 py-3 text-sm font-medium text-rose-100 transition hover:border-rose-200/80 hover:bg-rose-500/28"
                >
                  Launch App
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex rounded-xl border border-white/20 bg-white/7 px-5 py-3 text-sm font-medium text-white transition hover:border-white/35 hover:bg-white/12"
                >
                  Read Docs
                </Link>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[420px]">
                <div className="pointer-events-none absolute -left-12 -top-10 h-28 w-28 rounded-full bg-rose-500/28 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-10 -right-12 h-32 w-32 rounded-full bg-red-500/24 blur-3xl" />
                <div className="relative mx-auto aspect-square w-full">
                  <Image
                    src="/icon.png"
                    alt="AWRA logo"
                    fill
                    sizes="(min-width: 1024px) 420px, (min-width: 640px) 380px, 92vw"
                    className="awra-logo-glow object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="about"
          className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <article className="awra-panel p-6 sm:p-8">
              <p className="kicker">About AWRA</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Liquidation risk should be managed, not guessed.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/72 sm:text-base">
                DeFi borrowers often face static APRs, limited guidance, and
                delayed visibility into liquidation pressure. AWRA addresses
                this with a proactive, agentic lending model that adapts
                borrowing cost to borrower quality while continuously watching
                risk.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/72 sm:text-base">
                The result is a lending experience focused on intelligent
                protection: dynamic rate logic, live health-factor insight, and
                alerting before positions become critical. An in-app assistant
                also helps borrowers act on risk signals quickly.
              </p>
            </article>

            <div className="grid gap-4">
              {architectureItems.map((item) => (
                <article key={item.title} className="awra-panel p-5 sm:p-6">
                  <h3 className="text-lg font-medium text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/68">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="features"
          className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="max-w-2xl">
            <p className="kicker">Features</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Built for serious on-chain lending operations.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ title, description, Icon }) => (
              <article key={title} className="awra-panel p-5 sm:p-6">
                <div className="awra-icon-wrap">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/68">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="how-it-works"
          className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="max-w-2xl">
            <p className="kicker">How It Works</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              User to alert loop, continuously monitored.
            </h2>
          </div>
          <div className="relative mt-8 grid gap-4 lg:grid-cols-5">
            <span className="pointer-events-none absolute left-[8%] right-[8%] top-8 hidden h-px bg-gradient-to-r from-transparent via-white/30 to-transparent lg:block" />
            {flowSteps.map((step, index) => (
              <article
                key={step.title}
                className="awra-panel relative p-4 sm:p-5"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-200/45 bg-rose-500/16 text-xs font-semibold text-rose-100">
                  {index + 1}
                </span>
                <h3 className="mt-3 text-base font-medium text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/68">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pb-24">
          <article className="awra-panel flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center sm:gap-6 sm:p-8">
            <div>
              <p className="kicker">Start Building</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Explore AWRA in production-style interface.
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/lending-page"
                className="inline-flex rounded-xl border border-rose-200/55 bg-rose-500/18 px-5 py-3 text-sm font-medium text-rose-100 transition hover:border-rose-200/80 hover:bg-rose-500/28"
              >
                Launch App
              </Link>
              <Link
                href="/team"
                className="inline-flex rounded-xl border border-white/20 bg-white/7 px-5 py-3 text-sm font-medium text-white transition hover:border-white/35 hover:bg-white/12"
              >
                Meet Team
              </Link>
            </div>
          </article>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
