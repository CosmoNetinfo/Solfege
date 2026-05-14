"use client";

import { useState, useEffect } from "react";
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
  { name: "Finanze", href: "/admin/finances", icon: Banknote },
  { name: "Compensi", href: "/admin/compensi", icon: CheckSquare },
  { name: "Statistiche", href: "/admin/stats", icon: LayoutDashboard },
  { name: "Impostazioni", href: "/admin/impostazioni", icon: Settings },
];

import { Badge } from "@/components/ui/badge";

export function Sidebar() {
  const [schoolInfo, setSchoolInfo] = useState<{ name: string | null, plan: string | null, trialEndsAt: string | null }>({
    name: null,
    plan: null,
    trialEndsAt: null
  });
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    async function loadSchoolData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id, schools(name, plan, trial_ends_at)")
        .eq("id", user.id)
        .single();
      
      if (profile?.schools) {
        setSchoolInfo({
          name: profile.schools.name,
          plan: profile.schools.plan,
          trialEndsAt: profile.schools.trial_ends_at
        });
      }
    }
    loadSchoolData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const PlanBadge = ({ plan, trialEndsAt }: { plan: string | null, trialEndsAt: string | null }) => {
    if (!plan && plan !== 'free') return null;
    
    switch(plan) {
      case 'free':
        return <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-stone-300 text-stone-500 uppercase font-bold">Free</Badge>;
      case 'trial':
        const days = trialEndsAt ? Math.ceil((new Date(trialEndsAt).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;
        return <Badge className="text-[9px] h-4 px-1.5 bg-amber-500 text-white border-none uppercase font-bold">Trial {days > 0 ? `· ${days}gg` : ''}</Badge>;
      case 'starter':
        return <Badge className="text-[9px] h-4 px-1.5 bg-blue-500 text-white border-none uppercase font-bold">Starter</Badge>;
      case 'pro':
        return <Badge className="text-[9px] h-4 px-1.5 bg-green-600 text-white border-none uppercase font-bold">Pro</Badge>;
      case 'white_label':
        return <Badge className="text-[9px] h-4 px-1.5 bg-slate-900 text-white border-none uppercase font-bold text-center">White Label</Badge>;
      default:
        return <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-stone-300 text-stone-500 uppercase font-bold">Free</Badge>;
    }
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border shrink-0">
      {/* Header Sidebar: Logo & School Name */}
      <div className="flex flex-col h-24 justify-center px-6 border-b border-sidebar-border/50">
        <Image 
          src="/logo.png" 
          alt="Solfège Logo" 
          width={150} 
          height={40} 
          className="h-8 w-auto object-contain self-start"
          priority
        />
        {schoolInfo.name && (
          <div className="mt-2 flex items-center justify-between gap-2 overflow-hidden">
            <p className="text-xs font-semibold text-orange uppercase tracking-wider truncate flex-1">
              {schoolInfo.name}
            </p>
            <PlanBadge plan={schoolInfo.plan} trialEndsAt={schoolInfo.trialEndsAt} />
          </div>
        )}
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
