import Link from 'next/link'

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-accent-light rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-text-header mb-2">
              Check your email
            </h1>
            <p className="text-text-muted">
              We&apos;ve sent you a confirmation link. Please check your email
              to verify your account.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              Didn&apos;t receive the email? Check your spam folder or try
              signing up again.
            </p>

            <Link
              href="/auth/login"
              className="inline-block text-accent hover:text-accent-hover font-medium"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
