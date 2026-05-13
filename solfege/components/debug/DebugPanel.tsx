"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bug, 
  X, 
  Terminal, 
  Database, 
  Activity, 
  User, 
  Copy, 
  Trash2, 
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Info
} from "lucide-react";
import { useDebugStore, LogLevel } from "@/lib/debug/logger";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"session" | "logs" | "db" | "perf">("session");
  const { logs, clearLogs, lastQuery, queryStats } = useDebugStore();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [perfData, setPerfData] = useState<any>({ mem: 0, loadTime: 0 });

  const supabase = createClient();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadSession();
      loadPerf();
    }
  }, [isOpen]);

  async function loadSession() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*, schools(name)")
        .eq("id", user.id)
        .single();
      setProfile(profile);
    }
  }

  function loadPerf() {
    const mem = (performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) : 0;
    const loadTime = window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart;
    setPerfData({ mem, loadTime });
  }

  const exportLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solfege-debug-logs-${new Date().toISOString()}.json`;
    a.click();
  };

  // if (process.env.NODE_ENV !== 'development' && profile?.role !== 'admin') {
  //   return null;
  // }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-orange text-white shadow-lg hover:scale-110 transition-transform"
        aria-label="Apri Debug Panel"
      >
        <Bug className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-[80] w-[450px] bg-[#1A1714] text-[#E8E4E0] shadow-2xl flex flex-col font-mono text-xs"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#2D2A27] p-4 bg-[#23201D]">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-orange/20 flex items-center justify-center">
                    <Bug className="h-5 w-5 text-orange" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight">SOLFÈGE DEBUG</h3>
                    <p className="text-[10px] text-[#7A736C]">v1.0.0-dev</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-2 hover:bg-[#2D2A27] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs Nav */}
              <div className="flex border-b border-[#2D2A27] bg-[#1A1714]">
                {[
                  { id: "session", icon: User, label: "Sessione" },
                  { id: "logs", icon: Terminal, label: "Log" },
                  { id: "db", icon: Database, label: "Database" },
                  { id: "perf", icon: Activity, label: "Perf" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1 py-3 transition-colors border-b-2",
                      activeTab === tab.id 
                        ? "text-orange border-orange bg-orange/5" 
                        : "text-[#7A736C] border-transparent hover:text-[#E8E4E0]"
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="text-[10px] uppercase font-bold">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === "session" && (
                  <div className="space-y-4">
                    <Section title="Info Utente">
                      <Row label="User ID" value={user?.id} />
                      <Row label="Email" value={user?.email} />
                      <Row label="Ruolo" value={profile?.role} badge color="orange" />
                    </Section>
                    <Section title="Info Scuola">
                      <Row label="School ID" value={profile?.school_id} />
                      <Row label="Nome" value={profile?.schools?.name} />
                    </Section>
                    <Section title="Sessione">
                      <Row label="Ultimo Login" value={user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '-'} />
                    </Section>
                    <Button 
                      icon={Copy} 
                      onClick={() => navigator.clipboard.writeText(JSON.stringify({ user, profile }, null, 2))}
                    >
                      Copia session info
                    </Button>
                  </div>
                )}

                {activeTab === "logs" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between sticky top-0 bg-[#1A1714] pb-2">
                      <div className="flex gap-2">
                        <Button icon={Trash2} variant="danger" size="xs" onClick={clearLogs}>Clear</Button>
                        <Button icon={Download} size="xs" onClick={exportLogs}>Export</Button>
                      </div>
                      <span className="text-[10px] text-[#7A736C]">{logs.length} eventi</span>
                    </div>
                    <div className="space-y-1">
                      {logs.map((log) => (
                        <div key={log.id} className="group border-b border-[#2D2A27] py-2 hover:bg-[#23201D] transition-colors rounded px-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <LogBadge level={log.level} />
                              <span className="text-[10px] text-[#7A736C]">{log.timestamp}</span>
                            </div>
                          </div>
                          <p className="mt-1 text-[#E8E4E0] break-words">{log.message}</p>
                          {log.details && (
                            <pre className="mt-2 p-2 bg-black/30 rounded text-[9px] overflow-x-auto text-orange/80">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "db" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-2">
                      <StatCard label="Query" value={queryStats.total} color="orange" />
                      <StatCard label="Errori" value={queryStats.errors} color="red" />
                      <StatCard label="Avg MS" value={`${Math.round(queryStats.avgTime)}ms`} color="green" />
                    </div>
                    
                    <Section title="Connessione">
                      <div className="flex items-center gap-2 text-green">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Supabase Online</span>
                      </div>
                    </Section>

                    {lastQuery && (
                      <Section title="Ultima Query Exec">
                        <div className="p-3 bg-black/30 rounded border border-[#2D2A27] space-y-2">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-orange">{lastQuery.timestamp}</span>
                            <span className="text-green">{lastQuery.duration}ms</span>
                          </div>
                          <p className="text-[10px] leading-relaxed text-[#E8E4E0] italic">
                            "{lastQuery.query}"
                          </p>
                        </div>
                      </Section>
                    )}
                  </div>
                )}

                {activeTab === "perf" && (
                  <div className="space-y-4">
                    <Section title="Browser Resources">
                      <Row label="Memory Usage" value={`${perfData.mem} MB`} />
                      <Row label="Load Time" value={`${perfData.loadTime} ms`} />
                    </Section>
                    <Section title="App Environment">
                      <Row label="Route" value={window.location.pathname} />
                      <Row label="Node Env" value={process.env.NODE_ENV} />
                      <Row label="Next.js" value="14.2.0" />
                    </Section>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#2D2A27] bg-[#23201D] flex justify-between items-center text-[10px] text-[#7A736C]">
                <span>Solfège Admin Console</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 mb-6">
      <h4 className="text-[10px] uppercase font-bold text-[#7A736C] tracking-widest">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value, badge, color }: { label: string; value: string; badge?: boolean; color?: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-[#2D2A27]/50">
      <span className="text-[#7A736C]">{label}</span>
      {badge ? (
        <span className={cn(
          "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
          color === 'orange' ? "bg-orange/20 text-orange" : "bg-[#2D2A27] text-[#E8E4E0]"
        )}>
          {value}
        </span>
      ) : (
        <span className="text-[#E8E4E0] text-right break-all ml-4">{value || '-'}</span>
      )}
    </div>
  );
}

function LogBadge({ level }: { level: LogLevel }) {
  const styles = {
    INFO: "bg-[#2D2A27] text-[#7A736C]",
    SUCCESS: "bg-green/20 text-green",
    ERROR: "bg-red/20 text-red",
    WARN: "bg-amber/20 text-amber",
  };
  const icons = {
    INFO: Info,
    SUCCESS: CheckCircle2,
    ERROR: AlertCircle,
    WARN: AlertCircle,
  };
  const Icon = icons[level];

  return (
    <span className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase", styles[level])}>
      <Icon className="h-2.5 w-2.5" />
      {level}
    </span>
  );
}

function StatCard({ label, value, color }: { label: string; value: any; color: string }) {
  const colors = {
    orange: "text-orange border-orange/30 bg-orange/5",
    red: "text-red border-red/30 bg-red/5",
    green: "text-green border-green/30 bg-green/5",
  };
  return (
    <div className={cn("p-3 rounded-lg border flex flex-col items-center gap-1", colors[color as keyof typeof colors])}>
      <span className="text-[9px] uppercase font-bold opacity-70">{label}</span>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}

function Button({ children, icon: Icon, variant = "default", size = "default", onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded transition-colors font-bold uppercase text-[10px]",
        variant === "default" ? "bg-[#2D2A27] hover:bg-[#3D3A37] text-[#E8E4E0]" : "bg-red/20 hover:bg-red/30 text-red",
        size === "default" ? "w-full py-2.5" : "px-3 py-1.5"
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </button>
  );
}
