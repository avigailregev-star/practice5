export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-brand-surface border border-brand-gold mx-auto flex items-center justify-center mb-3">
            <span className="text-brand-gold text-xl font-bold">♩</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Practice5</h1>
          <p className="text-brand-muted text-sm mt-1">תרגול מוזיקה חכם</p>
        </div>
        {children}
      </div>
    </div>
  );
}
