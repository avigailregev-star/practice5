import TeacherBottomNav from "@/components/teacher/BottomNav";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-dark">
      <div className="pb-20">{children}</div>
      <TeacherBottomNav />
    </div>
  );
}
