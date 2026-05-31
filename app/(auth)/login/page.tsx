import Link from "next/link";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-bold text-center mb-6">כניסה</h2>
      <form className="space-y-4">
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
            placeholder="••••••••"
          />
        </div>
        <button
          formAction={login}
          className="w-full bg-brand-red text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-red-700 transition-colors"
        >
          כניסה
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        אין לך חשבון?{" "}
        <Link href="/register" className="text-brand-red font-semibold">
          הרשמה
        </Link>
      </p>
    </div>
  );
}
