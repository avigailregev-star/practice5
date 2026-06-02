import Link from "next/link";
import { signup } from "@/app/actions/auth";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="bg-brand-surface rounded-2xl p-6 border border-brand-border">
      <h2 className="text-xl font-bold text-center text-white mb-6">הרשמה</h2>
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1">שם מלא</label>
          <input
            name="name"
            type="text"
            required
            dir="rtl"
            className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-gold placeholder:text-brand-muted"
            placeholder="שם שלך"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1">אימייל</label>
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
          <label className="block text-sm font-medium text-brand-muted mb-1">סיסמה</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            dir="rtl"
            className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-gold placeholder:text-brand-muted"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1">אני</label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 border border-brand-border bg-brand-surface-2 rounded-lg p-3 cursor-pointer has-[:checked]:border-brand-gold has-[:checked]:bg-brand-surface">
              <input type="radio" name="role" value="student" defaultChecked className="accent-brand-gold" />
              <span className="text-sm font-medium text-white">תלמיד</span>
            </label>
            <label className="flex items-center gap-2 border border-brand-border bg-brand-surface-2 rounded-lg p-3 cursor-pointer has-[:checked]:border-brand-gold has-[:checked]:bg-brand-surface">
              <input type="radio" name="role" value="teacher" className="accent-brand-gold" />
              <span className="text-sm font-medium text-white">מורה</span>
            </label>
          </div>
        </div>
        <button
          formAction={signup}
          className="w-full bg-brand-gold text-black rounded-lg py-2.5 font-bold text-sm transition-opacity hover:opacity-90"
        >
          הרשמה
        </button>
      </form>
      <p className="text-center text-sm text-brand-muted mt-4">
        כבר רשום?{" "}
        <Link href="/login" className="text-brand-gold font-semibold">
          כניסה
        </Link>
      </p>
    </div>
  );
}
