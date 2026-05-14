"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Banknote,
  User,
  LogOut,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { name: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  { name: "Le Tue Lezioni", href: "/portal/presenze", icon: Calendar },
  { name: "Pagamenti", href: "/portal/pagamenti", icon: Banknote },
  { name: "Mio Profilo", href: "/portal/profilo", icon: User },
];

export function PortalSidebar() {
  const [userInfo, setUserInfo] = useState<{ 
    name: string | null, 
    role: string | null,
    schoolName: string | null,
    schoolLogo: string | null
  }>({
    name: null,
    role: null,
    schoolName: null,
    schoolLogo: null
  });
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, role, school_id, schools(name, logo_url)")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        const school = Array.isArray(profile.schools) ? profile.schools[0] : profile.schools;
        setUserInfo({
          name: `${profile.first_name} ${profile.last_name}`,
          role: profile.role,
          schoolName: school?.name || null,
          schoolLogo: school?.logo_url || null
        });
      }
    }
    loadUserData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-stone-200 shrink-0 shadow-sm z-20">
      {/* Header Sidebar: Logo & School Name */}
      <div className="flex flex-col h-24 justify-center px-6 border-b border-stone-100">
        {userInfo.schoolLogo ? (
          <Image 
            src={userInfo.schoolLogo} 
            alt={userInfo.schoolName || "Logo Scuola"} 
            width={130} 
            height={40} 
            className="h-10 w-auto object-contain self-start"
            priority
          />
        ) : (
          <h2 className="text-xl font-serif font-bold text-orange truncate">
            {userInfo.schoolName || "Solfège"}
          </h2>
        )}
        <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-orange/30 text-orange bg-orange/5 uppercase font-bold tracking-tighter">
                {userInfo.role === 'genitore' ? 'Portale Genitore' : 'Portale Allievo'}
            </Badge>
        </div>
      </div>

      {/* Navigazione */}
      <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                isActive
                  ? "bg-orange text-white shadow-md shadow-orange/20"
                  : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-white" : "text-stone-400 group-hover:text-stone-600"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer Sidebar: User & Logout */}
      <div className="p-4 border-t border-stone-100 bg-stone-50/50">
        <div className="px-4 py-3 mb-2">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Utente</p>
            <p className="text-sm font-semibold text-stone-900 truncate">{userInfo.name || "Caricamento..."}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Esci
        </button>
      </div>
    </div>
  );
}
