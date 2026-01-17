import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <main className="flex flex-col items-center gap-8 text-center max-w-md">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-accent-light)]">
          <ShoppingBag className="w-8 h-8 text-[var(--color-accent)]" />
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-semibold text-[var(--color-text-header)]">
            Shopping Assistant
          </h1>
          <p className="text-lg text-[var(--color-text-body)]">
            Your AI-powered personal shopping companion with psychological persona matching
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href="/chat"
            className="
              flex h-12 items-center justify-center
              bg-[var(--color-accent)] !text-white font-medium
              rounded-lg
              transition-colors duration-150 ease-out
              hover:bg-[var(--color-accent-hover)]
              focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2
            "
          >
            Start Shopping
          </Link>
          <Link
            href="/auth/login"
            className="
              flex h-12 items-center justify-center
              bg-white text-[var(--color-text-header)] font-medium
              border border-[var(--color-border)]
              rounded-lg
              transition-colors duration-150 ease-out
              hover:bg-[var(--color-surface-elevated)] hover:border-[#D1D5DB]
              focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2
            "
          >
            Sign In
          </Link>
        </div>

        <p className="text-sm text-[var(--color-text-muted)]">
          Discover products tailored to your unique shopping personality
        </p>
      </main>
    </div>
  );
}
