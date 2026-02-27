import type { Metadata } from "next";
import { SiteFooter } from "app/components/marketing/SiteFooter";
import { SiteHeader } from "app/components/marketing/SiteHeader";

export const metadata: Metadata = {
  title: "AWRA Docs",
  description: "Technical documentation for the AWRA agentic lending protocol.",
};

const docSections = [
  { id: "introduction", title: "Introduction" },
  { id: "protocol-overview", title: "Protocol Overview" },
  { id: "lending-borrowing", title: "Lending & Borrowing" },
  { id: "credit-score-model", title: "Credit Score Model" },
  { id: "oracle-system", title: "Oracle System" },
  { id: "ai-risk-agent", title: "AI Risk Agent" },
  { id: "smart-contracts", title: "Smart Contracts" },
  { id: "security", title: "Security" },
];

export default function DocsPage() {
  return (
    <div className="marketing-shell">
      <SiteHeader showSectionLinks={false} />
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="awra-panel p-4">
              <p className="kicker">Documentation</p>
              <p className="mt-3 text-sm text-white/65">
                AWRA Protocol v1 Architecture
              </p>
              <nav className="mt-4 grid gap-1">
                {docSections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="rounded-lg px-3 py-2 text-sm text-white/72 transition hover:bg-white/10 hover:text-white"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <div>
            <header className="awra-panel p-6 sm:p-8">
              <p className="kicker">AWRA Docs</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Agentic DeFi Lending Documentation
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/72 sm:text-base">
                AWRA combines overcollateralized lending with credit-aware APR
                and intelligent risk automation. This documentation summarizes
                protocol design, borrower flow, and infrastructure components.
              </p>
            </header>

            <article className="docs-prose mt-6 awra-panel p-6 sm:p-8">
              <section id="introduction" className="scroll-mt-24">
                <h2>Introduction</h2>
                <p>
                  AWRA is a decentralized lending protocol focused on improving
                  borrower safety and pricing fairness. Instead of static
                  borrowing rates and passive dashboards, AWRA introduces an
                  agentic system that proactively monitors risk and notifies
                  users before positions become fragile.
                </p>
              </section>

              <section id="protocol-overview" className="scroll-mt-24">
                <h2>Protocol Overview</h2>
                <p>
                  The protocol is composed of a lending pool smart contract,
                  oracle-fed pricing, borrower credit inputs, and an AI risk
                  monitoring layer. Borrowers deposit supported collateral
                  assets, open debt positions, and receive adaptive APR based on
                  credit signals.
                </p>
                <p>
                  The core objective is capital efficiency with reduced
                  liquidation surprises through continuous monitoring and
                  proactive communication.
                </p>
              </section>

              <section id="lending-borrowing" className="scroll-mt-24">
                <h2>Lending & Borrowing</h2>
                <p>
                  AWRA follows an overcollateralized model. Users first deposit
                  approved collateral and then borrow assets within risk
                  constraints determined by collateral factor and current health
                  factor.
                </p>
                <p>
                  Borrow positions can be repaid partially or fully at any time.
                  Collateral can be withdrawn as long as post-withdrawal health
                  remains above the liquidation threshold.
                </p>
                <pre>
                  <code>{`// Position health approximation
healthFactor = (collateralValue * liquidationThreshold) / debtValue

// Borrowing power approximation
maxBorrow = collateralValue * collateralFactor - currentDebt`}</code>
                </pre>
              </section>

              <section id="credit-score-model" className="scroll-mt-24">
                <h2>Credit Score Model</h2>
                <p>
                  AWRA assigns borrower APR ranges using credit-derived inputs
                  such as repayment consistency, utilization behavior, and
                  historical risk profile. Better credit behavior can result in
                  improved borrowing terms compared with baseline rates.
                </p>
                <p>
                  This framework encourages responsible repayment behavior while
                  preserving transparent protocol economics.
                </p>
              </section>

              <section id="oracle-system" className="scroll-mt-24">
                <h2>Oracle System</h2>
                <p>
                  Price feeds are consumed through oracle integrations to update
                  collateral valuation and debt exposure. Oracle updates are used
                  directly in health factor computation and risk agent signals.
                </p>
                <p>
                  Fallback handling and heartbeat checks are enforced to reduce
                  stale-price risk during high volatility periods.
                </p>
              </section>

              <section id="ai-risk-agent" className="scroll-mt-24">
                <h2>AI Risk Agent</h2>
                <p>
                  AWRA&apos;s risk monitoring agent tracks borrower positions
                  continuously and scores liquidation proximity. If a position
                  crosses configurable risk thresholds, the agent emits
                  in-app alerts and proactive email notifications.
                </p>
                <pre>
                  <code>{`if (healthFactor < warningThreshold) {
  notifyBorrower("warning");
}

if (healthFactor < criticalThreshold) {
  notifyBorrower("critical");
  escalateMonitoringInterval();
}`}</code>
                </pre>
              </section>

              <section id="smart-contracts" className="scroll-mt-24">
                <h2>Smart Contracts</h2>
                <p>
                  Smart contracts manage deposits, borrows, repayments,
                  withdrawals, collateral factors, and liquidation logic.
                  Contracts are designed to keep accounting deterministic and
                  isolate privileged actions behind explicit access controls.
                </p>
                <p>
                  Integration points include token contracts, oracle adapters,
                  and risk-agent event listeners.
                </p>
              </section>

              <section id="security" className="scroll-mt-24">
                <h2>Security</h2>
                <p>
                  Security posture includes contract review, role minimization,
                  tested failure paths, and monitoring for abnormal activity.
                  Governance actions should be protected by multisig execution
                  and operational runbooks.
                </p>
                <p>
                  Recommended production hardening includes formal verification
                  for critical logic, independent audits, and staged rollout
                  policies.
                </p>
              </section>
            </article>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
