"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardCheck, Users, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Home", href: "/teacher/home", icon: Home },
  { name: "Presenze", href: "/teacher/attendance", icon: ClipboardCheck },
  { name: "Allievi", href: "/teacher/students", icon: Users },
  { name: "Profilo", href: "/teacher/profile", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-white border-t border-[#E8E4E0] flex items-center justify-around px-2 pb-safe">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-full h-full transition-colors",
              isActive ? "text-[#E8621A]" : "text-[#7A736C] hover:text-[#1A1714]"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl transition-colors",
              isActive ? "bg-[#FDF0E8]" : "bg-transparent"
            )}>
              <item.icon className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-medium tracking-wide uppercase">
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
