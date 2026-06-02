"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users } from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "תלמידים", Icon: Users },
];

export default function TeacherBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 right-0 left-0 bg-brand-card border-t border-brand-border">
      <div className="flex">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
                active ? "text-brand-teal" : "text-brand-faint"
              }`}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
