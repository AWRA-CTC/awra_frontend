import Link from "next/link";
import Image from "next/image";

type SiteHeaderProps = {
  showSectionLinks?: boolean;
};

const sectionLinks = [
  { label: "About", href: "/#about" },
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
];

export const SiteHeader = ({ showSectionLinks = true }: SiteHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/45 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
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
            <p className="text-xs uppercase tracking-[0.26em] text-white/60">
              AWRA
            </p>
            <p className="text-sm font-medium text-white/90">Protocol</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {showSectionLinks
            ? sectionLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </Link>
              ))
            : null}
          <Link
            href="/team"
            className="rounded-xl px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Team
          </Link>
          <Link
            href="/docs"
            className="rounded-xl px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Docs
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/docs"
            className="hidden rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white transition hover:border-white/30 hover:bg-white/10 sm:inline-flex"
          >
            Read Docs
          </Link>
          <Link
            href="/lending-page"
            className="inline-flex rounded-xl border border-rose-300/45 bg-rose-500/15 px-4 py-2 text-sm font-medium text-rose-100 transition hover:border-rose-200/70 hover:bg-rose-500/20"
          >
            Launch App
          </Link>
        </div>
      </div>

      {showSectionLinks ? (
        <nav className="mx-auto flex w-full max-w-6xl items-center gap-1 overflow-x-auto px-4 pb-3 text-sm md:hidden sm:px-6">
          {sectionLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-white/80 transition hover:border-white/30 hover:bg-white/10"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/team"
            className="whitespace-nowrap rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-white/80 transition hover:border-white/30 hover:bg-white/10"
          >
            Team
          </Link>
        </nav>
      ) : null}
    </header>
  );
};
