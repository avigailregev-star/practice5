import BottomNav from "@/components/student/BottomNav";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="pb-20">{children}</div>
      <BottomNav />
    </div>
  );
}
