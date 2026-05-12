"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  GraduationCap,
  BookOpen,
  CheckSquare,
  Banknote,
  DoorOpen,
  Settings,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Calendario", href: "/admin/calendar", icon: Calendar },
  { name: "Studenti", href: "/admin/students", icon: Users },
  { name: "Insegnanti", href: "/admin/teachers", icon: GraduationCap },
  { name: "Corsi", href: "/admin/courses", icon: BookOpen },
  { name: "Presenze", href: "/admin/attendance", icon: CheckSquare },
  { name: "Finanze", href: "/admin/finances", icon: Banknote },
  { name: "Statistiche", href: "/admin/stats", icon: LayoutDashboard }, // Usando LayoutDashboard o BarChart3
  { name: "Aule", href: "/admin/rooms", icon: DoorOpen },
  { name: "Impostazioni", href: "/admin/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Header Sidebar: Logo */}
      <div className="flex h-16 items-center px-6">
        <Image 
          src="/solfege-logo.png" 
          alt="Solfège Logo" 
          width={150} 
          height={40} 
          className="h-10 w-auto object-contain"
          priority
        />
      </div>

      {/* Navigazione */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-r-md transition-colors",
                isActive
                  ? "bg-orange/10 text-orange border-l-[3px] border-orange"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground border-l-[3px] border-transparent"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-orange" : "text-sidebar-foreground opacity-70 group-hover:opacity-100"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer Sidebar: Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground rounded-md transition-colors"
        >
          <LogOut className="h-5 w-5 opacity-70" />
          Esci
        </button>
      </div>
    </div>
  );
}
