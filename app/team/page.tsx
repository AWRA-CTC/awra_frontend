import type { Metadata } from "next";
import Image from "next/image";
import { SiteFooter } from "app/components/marketing/SiteFooter";
import { SiteHeader } from "app/components/marketing/SiteHeader";
import { link } from "fs";

export const metadata: Metadata = {
  title: "AWRA Team",
  description: "Core contributors building the AWRA lending protocol.",
};

const teamMembers = [
  {
    name: "Fraol Bereket",
    role: "Fullstack Blockchain Engineer",
    bio: "Designs and implements lending pool, collateral, and liquidation smart contract logic for secure execution.",
    image: "/fraolb.jpeg",
    github: "https://github.com/fraolb",
    twitter: "https://x.com/fraolchris",
    linkedin: "https://www.linkedin.com/in/fraol-bereket-bekele/",
  },
  {
    name: "Amanuel Mekonnen",
    role: "AI Engineer",
    bio: "Develops the risk monitoring agent that evaluates health factors, volatility shifts, and liquidation probability.",
    image: "/ammanuelm.jpeg",
    github: "https://github.com/Ammanuelmek",
    twitter: "https://x.com/AmmanuelMekonn1",
    linkedin: "https://www.linkedin.com/in/amajo04/",
  },
  {
    name: "Natnael Mesfin",
    role: "Protocol Researcher & Security Engineer",
    bio: "Researches credit-aware lending mechanics and stress-tests APR and liquidation incentive models.",
    image: "/natnaelm.jpeg",
    github: "https://github.com/NatnaelMesfin7",
    twitter: "https://x.com/natypanda7",
    linkedin: "https://www.linkedin.com/in/natnael-mesfin-97a6921ba/",
  },
];

export default function TeamPage() {
  return (
    <div className="marketing-shell">
      <SiteHeader showSectionLinks={false} />
      <main className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <header className="max-w-3xl">
          <p className="kicker">Team</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Building reliable agentic lending infrastructure.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/72 sm:text-base">
            AWRA combines protocol engineering, AI systems, and interface design
            to make decentralized borrowing safer and more intelligent.
          </p>
        </header>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => (
            <article key={member.name} className="awra-panel p-6">
              <div className="flex items-start gap-4">
                <span className="w-12 h-12 rounded-full overflow-hidden inline-block">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                </span>
                <div>
                  <h2 className="text-lg font-medium text-white">
                    {member.name}
                  </h2>
                  <p className="mt-1 text-sm text-rose-100/85">{member.role}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/68">
                {member.bio}
              </p>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <a
                  href={member.github}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/70 transition hover:text-white"
                >
                  GitHub
                </a>
                <a
                  href={member.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/70 transition hover:text-white"
                >
                  Twitter
                </a>
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/70 transition hover:text-white"
                >
                  LinkedIn
                </a>
              </div>
            </article>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
