import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Key, AlertTriangle, Package, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

export const revalidate = 0; // Disable server-side caching for superadmin dashboard

export default async function SuperadminDashboard() {
  const adminDb = createAdminClient();

  // Fetch KPI data in parallel
  const [
    { count: licensesCount },
    { count: activeCount },
    { count: errorsCount },
    currentReleaseRes,
    recentErrorsRes,
    recentActivationsRes
  ] = await Promise.all([
    adminDb.from("licenses" as any).select("*", { count: "exact", head: true }),
    adminDb.from("licenses" as any).select("*", { count: "exact", head: true }).eq("status", "active"),
    adminDb.from("error_reports" as any).select("*", { count: "exact", head: true }).eq("resolved", false),
    adminDb.from("app_releases" as any).select("version").eq("is_current", true).maybeSingle(),
    adminDb.from("error_reports" as any).select("*").order("created_at", { ascending: false }).limit(5),
    adminDb.from("licenses" as any).select("*").eq("status", "active").order("activated_at", { ascending: false }).limit(5)
  ]);

  const currentRelease = currentReleaseRes.data as any;
  const recentErrors = recentErrorsRes.data as any[] | null;
  const recentActivations = recentActivationsRes.data as any[] | null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-serif text-[#E8621A] font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Monitoraggio globale della piattaforma Solfège.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Licenze Totali</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{licensesCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Licenze Attive</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Errori non Risolti</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{errorsCount || 0}</span>
              {(errorsCount || 0) > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  Attenzione
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Versione Corrente</CardTitle>
            <Package className="h-4 w-4 text-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange">{currentRelease?.version || "N/D"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Error Reports */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-xl font-serif font-bold text-foreground">Ultimi 5 Errori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Schermata</TableHead>
                    <TableHead>Messaggio</TableHead>
                    <TableHead className="text-right">Rilevato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentErrors && recentErrors.length > 0 ? (
                    recentErrors.map((err) => (
                      <TableRow key={err.id}>
                        <TableCell className="font-semibold">{err.screen_name || "Generico"}</TableCell>
                        <TableCell className="truncate max-w-[200px]">{err.error_message}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(err.created_at), { addSuffix: true, locale: it })}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                        Nessun errore segnalato
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activations */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-xl font-serif font-bold text-foreground">Ultime 5 Attivazioni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Licenza</TableHead>
                    <TableHead className="text-right">Attivata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivations && recentActivations.length > 0 ? (
                    recentActivations.map((lic) => (
                      <TableRow key={lic.id}>
                        <TableCell>
                          <div className="font-medium">{lic.customer_name}</div>
                          <div className="text-xs text-muted-foreground">{lic.customer_email}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{lic.license_key}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {lic.activated_at
                            ? formatDistanceToNow(new Date(lic.activated_at), { addSuffix: true, locale: it })
                            : "N/D"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                        Nessuna licenza attiva registrata
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
