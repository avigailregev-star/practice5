import Link from "next/link";
import { signup } from "@/app/actions/auth";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-bold text-center mb-6">הרשמה</h2>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            שם מלא
          </label>
          <input
            name="name"
            type="text"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
            placeholder="שם שלך"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            אימייל
          </label>
          <input
            name="email"
            type="email"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            סיסמה
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            אני
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 border border-gray-200 rounded-lg p-3 cursor-pointer has-[:checked]:border-brand-red has-[:checked]:bg-red-50">
              <input type="radio" name="role" value="student" defaultChecked className="accent-brand-red" />
              <span className="text-sm font-medium">תלמיד 🎸</span>
            </label>
            <label className="flex items-center gap-2 border border-gray-200 rounded-lg p-3 cursor-pointer has-[:checked]:border-brand-red has-[:checked]:bg-red-50">
              <input type="radio" name="role" value="teacher" className="accent-brand-red" />
              <span className="text-sm font-medium">מורה 🎓</span>
            </label>
          </div>
        </div>
        <button
          formAction={signup}
          className="w-full bg-brand-red text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-red-700 transition-colors"
        >
          הרשמה
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        כבר רשום?{" "}
        <Link href="/login" className="text-brand-red font-semibold">
          כניסה
        </Link>
      </p>
    </div>
  );
}
