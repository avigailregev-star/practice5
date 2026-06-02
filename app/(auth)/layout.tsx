export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-brand-pink mx-auto flex items-center justify-center mb-3">
            <span className="text-white text-xl font-bold">♩</span>
          </div>
          <h1 className="text-2xl font-bold text-brand-text">Practice5</h1>
          <p className="text-brand-muted text-sm mt-1">תרגול מוזיקה חכם</p>
        </div>
        {children}
      </div>
    </div>
  );
}
