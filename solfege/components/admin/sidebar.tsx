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
  LogOut,
  ShieldCheck,
  Globe,
  RefreshCw,
  Cloud
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { isDesktop } from "@/lib/is-desktop";
import { invoke } from "@tauri-apps/api/core";
import Database from "@tauri-apps/plugin-sql";
import { syncLocalToCloud } from "@/lib/services/cloud-sync";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Calendario", href: "/admin/calendar", icon: Calendar },
  { name: "Sale & Prove", href: "/admin/sale", icon: DoorOpen },
  { name: "Studenti", href: "/admin/students", icon: Users },
  { name: "Iscrizioni Web", href: "/admin/iscrizioni", icon: Globe },
  { name: "Insegnanti", href: "/admin/teachers", icon: GraduationCap },
  { name: "Corsi", href: "/admin/courses", icon: BookOpen },
  { name: "Finanze", href: "/admin/finances", icon: Banknote },
  { name: "Compensi", href: "/admin/compensi", icon: CheckSquare },
  { name: "Statistiche", href: "/admin/stats", icon: LayoutDashboard },
  { name: "Impostazioni", href: "/admin/impostazioni", icon: Settings },
];

import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function Sidebar() {
  const [role, setRole] = useState<string | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<{ name: string | null, plan: string | null, trialEndsAt: string | null }>({
    name: null,
    plan: null,
    trialEndsAt: null
  });
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    async function loadLastSync() {
      if (isDesktop()) {
        try {
          const val = await invoke<string | null>("get_config", { key: "last_cloud_sync_at" });
          if (val) {
            setLastSync(new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        } catch (e) {
          console.error("Errore recupero ultimo sync:", e);
        }
      }
    }
    loadLastSync();
  }, [syncing]);

  useEffect(() => {
    async function loadSchoolData() {
      if (isDesktop()) {
        try {
          const user = await invoke<{ role: string } | null>("get_current_user");
          if (user) {
            setRole(user.role);
          }
          const db = await Database.load("sqlite:solfege.db");
          const schools = await db.select<{ nome: string }[]>("SELECT nome FROM schools LIMIT 1");
          if (schools && schools.length > 0) {
            setSchoolInfo({
              name: schools[0].nome,
              plan: "pro",
              trialEndsAt: null
            });
          }
        } catch (err) {
          console.error("Error loading SQLite school data:", err);
        }
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id, role, schools(name, plan, trial_ends_at)")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setRole(profile.role);
        if (profile.schools) {
          setSchoolInfo({
            name: profile.schools.name,
            plan: profile.schools.plan,
            trialEndsAt: profile.schools.trial_ends_at
          });
        }
      }
    }
    loadSchoolData();
  }, []);

  const handleLogout = async () => {
    if (isDesktop()) {
      try {
        await invoke("logout");
      } catch (err) {
        console.error("Error during logout:", err);
      }
      window.location.href = "/login-desktop";
      return;
    }
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col h-full shrink-0">
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
          </div>
        )}
      </div>

      {role === 'superadmin' && (
        <div className="px-3 pt-4">
          <Link
            href="/superadmin"
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-[rgba(232,98,26,0.15)] border border-[#E8621A] text-[#E8621A] hover:bg-[rgba(232,98,26,0.25)] transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Super Admin Panel
          </Link>
        </div>
      )}

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

      {/* Footer Sidebar: Logout & Credits */}
      <div className="mt-auto border-t border-sidebar-border">
        {isDesktop() && (
          <div className="px-4 pt-4 pb-2 border-b border-sidebar-border/30">
            <button
              onClick={async () => {
                setSyncing(true);
                const toastId = toast.loading("Sincronizzazione in corso...");
                const res = await syncLocalToCloud();
                setSyncing(false);
                if (res.success) {
                  toast.success(res.message, { id: toastId });
                } else {
                  toast.error(res.message, { id: toastId });
                }
              }}
              disabled={syncing}
              className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground rounded-md transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className={cn("h-4 w-4 text-orange", syncing && "animate-spin")} />
                <span>Sincronizza Cloud</span>
              </div>
              {lastSync && (
                <span className="text-[10px] text-stone-500 font-normal">
                  Sync: {lastSync}
                </span>
              )}
            </button>
          </div>
        )}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground rounded-md transition-colors"
          >
            <LogOut className="h-5 w-5 opacity-70" />
            Esci
          </button>
        </div>

        <div style={{
          padding: '0.75rem 1rem',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <p style={{ fontSize: '0.7rem', color: '#5A534C', lineHeight: 1.5 }}>
            Sviluppato da<br/>
            <a 
              href="https://www.cosmonet.info"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#7A736C', textDecoration: 'none' }}
            >
              Daniele Spalletti
            </a>
            {' '}·{' '}
            <a 
              href="https://www.cosmonet.info"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#7A736C', textDecoration: 'none' }}
            >
              CosmoNet.info
            </a>
          </p>
          <p style={{ fontSize: '0.65rem', color: '#3D3830', marginTop: '0.25rem' }}>
            Solfège v2.0
          </p>
        </div>
      </div>
    </div>
  );
}
