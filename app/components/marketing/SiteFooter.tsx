import Link from "next/link";

export const SiteFooter = () => {
  return (
    <footer className="border-t border-white/10 bg-black/35">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-medium text-white">AWRA</p>
          <p className="mt-1 text-sm text-white/55">© 2026 AWRA</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <a
            href="https://github.com/AWRA-CTC/"
            target="_blank"
            rel="noreferrer"
            className="text-white/70 transition hover:text-white"
          >
            GitHub
          </a>
          <Link
            href="/docs"
            className="text-white/70 transition hover:text-white"
          >
            Docs
          </Link>
          <Link
            href="/team"
            className="text-white/70 transition hover:text-white"
          >
            Team
          </Link>
          <a
            href="https://x.com/AwraLabs"
            target="_blank"
            rel="noreferrer"
            className="text-white/70 transition hover:text-white"
          >
            Twitter
          </a>
        </div>
      </div>
    </footer>
  );
};
