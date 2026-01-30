import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-slate-50 to-white">
      <div className="text-center max-w-xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-600 text-white text-2xl font-bold mb-6">
          AI
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
          Plan your study-abroad journey with a guided AI counsellor.
        </h1>
        <p className="text-slate-600 mb-8">
          Get clarity, shortlist universities, lock your choices, and prepare applications—step by step.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="btn-primary inline-flex items-center justify-center"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="btn-secondary inline-flex items-center justify-center"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
