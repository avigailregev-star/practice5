import Link from "next/link";
import { login } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="bg-brand-surface rounded-2xl p-6 border border-brand-border">
      <h2 className="text-xl font-bold text-center text-white mb-6">כניסה</h2>
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-lg px-3 py-2 mb-4">
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
            className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-gold placeholder:text-brand-muted"
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
            className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-gold placeholder:text-brand-muted"
            placeholder="••••••••"
          />
        </div>
        <button
          formAction={login}
          className="w-full bg-brand-gold text-black rounded-lg py-2.5 font-bold text-sm transition-opacity hover:opacity-90"
        >
          כניסה
        </button>
      </form>
      <p className="text-center text-sm text-brand-muted mt-4">
        אין לך חשבון?{" "}
        <Link href="/register" className="text-brand-gold font-semibold">
          הרשמה
        </Link>
      </p>
    </div>
  );
}
