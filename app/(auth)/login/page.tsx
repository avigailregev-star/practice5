import Link from "next/link";
import { login } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="bg-brand-card rounded-3xl border border-brand-border shadow-sm p-8">
      <p className="text-brand-pink font-bold tracking-widest text-xs text-center mb-4">PRACTICE5</p>
      <h2 className="text-brand-text font-extrabold text-2xl text-center mb-6">כניסה</h2>
      {error && (
        <div className="text-red-500 text-sm rounded-lg px-3 py-2 mb-4 border border-red-200 bg-red-50">
          {error}
        </div>
      )}
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1">
            אימייל
          </label>
          <input
            name="email"
            type="email"
            required
            dir="rtl"
            className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-pink placeholder:text-brand-faint"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1">
            סיסמה
          </label>
          <input
            name="password"
            type="password"
            required
            dir="rtl"
            className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-pink placeholder:text-brand-faint"
            placeholder="••••••••"
          />
        </div>
        <button
          formAction={login}
          className="w-full bg-brand-pink text-white rounded-xl py-2.5 font-bold text-sm transition-opacity hover:opacity-90"
        >
          כניסה
        </button>
      </form>
      <p className="text-center text-sm text-brand-muted mt-4">
        אין לך חשבון?{" "}
        <Link href="/register" className="text-brand-pink font-semibold">
          הרשמה
        </Link>
      </p>
    </div>
  );
}
