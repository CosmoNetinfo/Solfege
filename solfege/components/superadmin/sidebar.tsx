"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Key,
  AlertTriangle,
  Package,
  LogOut,
  Monitor
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { name: "Dashboard", href: "/superadmin", icon: LayoutDashboard },
  { name: "Licenze", href: "/superadmin/licenze", icon: Key },
  { name: "Errori", href: "/superadmin/errori", icon: AlertTriangle },
  { name: "Release", href: "/superadmin/release", icon: Package },
];

export function SuperadminSidebar() {
  const pathname = usePathname();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col h-full shrink-0">
      {/* Header: Logo + Super Admin badge */}
      <div className="flex flex-col h-24 justify-center px-6 border-b border-sidebar-border/50">
        <Image
          src="/logo.png"
          alt="Solfege Logo"
          width={150}
          height={40}
          className="h-8 w-auto object-contain self-start"
          priority
        />
        <div className="mt-2 flex items-center gap-2">
          <Badge className="text-[9px] h-4 px-1.5 bg-orange text-white border-none uppercase font-bold">
            Super Admin
          </Badge>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/superadmin"
              ? pathname === "/superadmin"
              : pathname.startsWith(item.href);
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
                  isActive
                    ? "text-orange"
                    : "text-sidebar-foreground opacity-70 group-hover:opacity-100"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer: Logout + Credits */}
      <div className="mt-auto border-t border-sidebar-border">
        <div className="p-4 flex flex-col gap-2">
          <Link
            href="/admin/dashboard"
            className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground rounded-md transition-colors"
          >
            <Monitor className="h-5 w-5 opacity-70" />
            Vai all'App
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground rounded-md transition-colors"
          >
            <LogOut className="h-5 w-5 opacity-70" />
            Esci
          </button>
        </div>

        <div
          style={{
            padding: "0.75rem 1rem",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <p style={{ fontSize: "0.7rem", color: "#5A534C", lineHeight: 1.5 }}>
            Sviluppato da
            <br />
            <a
              href="https://www.cosmonet.info"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#7A736C", textDecoration: "none" }}
            >
              Daniele Spalletti
            </a>
            {" "}·{" "}
            <a
              href="https://www.cosmonet.info"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#7A736C", textDecoration: "none" }}
            >
              CosmoNet.info
            </a>
          </p>
          <p
            style={{
              fontSize: "0.65rem",
              color: "#3D3830",
              marginTop: "0.25rem",
            }}
          >
            Solfege v1.5
          </p>
        </div>
      </div>
    </div>
  );
}
