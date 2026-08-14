import Link from "next/link";
import { MaiTabLogo } from "@/components/branding/MaiTabLogo";

export function LegalDoc({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-[#0c0c0f] text-[#E7E5E4]">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/">
            <MaiTabLogo variant="FullLogoWithText" onDark className="h-8 w-auto" />
          </Link>
          <Link
            href="/"
            className="text-sm text-white/55 transition hover:text-white"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
          Legal & Governance · Updated {updated}
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        <div className="prose-invert mt-8 space-y-4 text-sm leading-relaxed text-white/65 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_strong]:text-white/85">
          {children}
        </div>
        <p className="mt-12 border-t border-white/10 pt-6 text-xs text-white/35">
          © 2026 mAITab. Designed, Built & Operated by Syncra Systems LLP.
        </p>
      </main>
    </div>
  );
}
