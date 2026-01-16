import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8 text-center">
        <h1 className="text-6xl font-bold">
          <span className="text-primary">Cooked</span>
        </h1>

        <p className="text-2xl text-text-secondary">
          Hold your friends accountable.{' '}
          <span className="text-text-primary">Get roasted when you fold.</span>
        </p>

        <div className="flex gap-4 justify-center mt-12">
          <Link
            href="/login"
            className="px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="px-8 py-4 bg-surface-elevated text-text-primary rounded-lg font-semibold hover:bg-surface-elevated/80 transition-colors border border-text-muted/20"
          >
            Sign Up
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="p-6 bg-surface rounded-lg">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Set Pacts</h3>
            <p className="text-text-secondary">
              Create accountability pacts with your friends. Daily check-ins keep everyone honest.
            </p>
          </div>

          <div className="p-6 bg-surface rounded-lg">
            <div className="text-3xl mb-3">🔥</div>
            <h3 className="text-xl font-semibold mb-2">Get Roasted</h3>
            <p className="text-text-secondary">
              Fold on your commitment? Your squad will roast you mercilessly. No excuses.
            </p>
          </div>

          <div className="p-6 bg-surface rounded-lg">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
            <p className="text-text-secondary">
              Weekly recaps, achievements, and analytics. See who's crushing it and who's getting cooked.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
