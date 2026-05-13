import { Sidebar } from "@/components/admin/sidebar";
import { DebugPanel } from "@/components/debug/DebugPanel";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background font-sans antialiased">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <DebugPanel />
    </div>
  );
}
