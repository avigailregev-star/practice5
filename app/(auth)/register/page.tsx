import Link from "next/link";
import { signup } from "@/app/actions/auth";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="bg-brand-card rounded-3xl border border-brand-border shadow-sm p-8">
      <p className="text-brand-pink font-bold tracking-widest text-xs text-center mb-4">PRACTICE5</p>
      <h2 className="text-brand-text font-extrabold text-2xl text-center mb-6">הרשמה</h2>
      {error && (
        <div className="text-red-500 text-sm rounded-lg px-3 py-2 mb-4 border border-red-200 bg-red-50">
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
            className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-pink placeholder:text-brand-faint"
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
            className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-pink placeholder:text-brand-faint"
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
            className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-pink placeholder:text-brand-faint"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1">אני</label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 border border-brand-border bg-brand-bg rounded-xl p-3 cursor-pointer has-[:checked]:border-brand-pink has-[:checked]:bg-brand-pink has-[:checked]:text-white">
              <input type="radio" name="role" value="student" defaultChecked className="accent-brand-pink" />
              <span className="text-sm font-medium text-brand-muted has-[:checked]:text-white">תלמיד</span>
            </label>
            <label className="flex items-center gap-2 border border-brand-border bg-brand-bg rounded-xl p-3 cursor-pointer has-[:checked]:border-brand-pink has-[:checked]:bg-brand-pink has-[:checked]:text-white">
              <input type="radio" name="role" value="teacher" className="accent-brand-pink" />
              <span className="text-sm font-medium text-brand-muted has-[:checked]:text-white">מורה</span>
            </label>
          </div>
        </div>
        <button
          formAction={signup}
          className="w-full bg-brand-pink text-white rounded-xl py-2.5 font-bold text-sm transition-opacity hover:opacity-90"
        >
          הרשמה
        </button>
      </form>
      <p className="text-center text-sm text-brand-muted mt-4">
        כבר רשום?{" "}
        <Link href="/login" className="text-brand-pink font-semibold">
          כניסה
        </Link>
      </p>
    </div>
  );
}
