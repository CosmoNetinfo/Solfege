"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ErrorReport {
  id: string;
  license_key: string;
  error_type: string;
  error_message: string;
  error_stack: string | null;
  screen_name: string | null;
  action_performed: string | null;
  app_version: string;
  os_info: string;
  resolved: boolean;
  resolved_at: string | null;
  resolved_note: string | null;
  created_at: string;
}

export default function ErroriPage() {
  const [reports, setReports] = useState<ErrorReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("open");
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Resolution dialog state
  const [resolvingReport, setResolvingReport] = useState<ErrorReport | null>(null);
  const [resNote, setResNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  const fetchReports = async () => {
    setLoading(true);
    let query = supabase.from("error_reports" as any).select("*");

    if (filter === "open") {
      query = query.eq("resolved", false);
    } else if (filter === "resolved") {
      query = query.eq("resolved", true);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (!error && data) {
      setReports(data as unknown as ErrorReport[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingReport) return;
    setSubmitting(true);

    const { error } = await supabase
      .from("error_reports" as any)
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_note: resNote || null,
      })
      .eq("id", resolvingReport.id);

    if (!error) {
      fetchReports();
      setResolvingReport(null);
      setResNote("");
    } else {
      alert("Errore nel salvataggio: " + error.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-serif text-[#E8621A] font-bold">Monitoraggio Errori</h1>
        <p className="text-muted-foreground mt-2">Traccia e risolvi le anomalie segnalate dalle app desktop dei clienti.</p>
      </div>

      <div className="flex items-center justify-between">
        <Tabs value={filter} onValueChange={(val: any) => setFilter(val)}>
          <TabsList className="bg-stone-100 border border-stone-200 p-1 rounded-lg">
            <TabsTrigger value="open" className="font-bold data-[state=active]:bg-white data-[state=active]:text-orange">Aperti</TabsTrigger>
            <TabsTrigger value="resolved" className="font-bold data-[state=active]:bg-white data-[state=active]:text-orange">Risolti</TabsTrigger>
            <TabsTrigger value="all" className="font-bold data-[state=active]:bg-white data-[state=active]:text-orange">Tutti</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Caricamento errori...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Data/Ora</TableHead>
                <TableHead>Licenza</TableHead>
                <TableHead>Schermata</TableHead>
                <TableHead>Azione</TableHead>
                <TableHead>Errore</TableHead>
                <TableHead>Versione & OS</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length > 0 ? (
                reports.map((rep) => {
                  const isExpanded = expandedReportId === rep.id;
                  return (
                    <>
                      <TableRow key={rep.id} className="hover:bg-stone-50/50">
                        <TableCell>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setExpandedReportId(isExpanded ? null : rep.id)}>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {new Date(rep.created_at).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" })}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {rep.license_key ? `${rep.license_key.substring(0, 13)}...` : "-"}
                        </TableCell>
                        <TableCell className="font-semibold text-sm">{rep.screen_name || "Generico"}</TableCell>
                        <TableCell className="text-sm">{rep.action_performed || "-"}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{rep.error_message}</TableCell>
                        <TableCell className="text-xs">
                          <span className="font-bold">v{rep.app_version}</span>
                          <span className="text-muted-foreground block truncate max-w-[100px]">{rep.os_info}</span>
                        </TableCell>
                        <TableCell>
                          {rep.resolved ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Risolto</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">Aperto</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!rep.resolved && (
                            <Button size="sm" className="bg-[#E8621A] hover:bg-[#C94E0E] text-white" onClick={() => setResolvingReport(rep)}>
                              <CheckCircle className="h-4 w-4 mr-1" /> Risolvi
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${rep.id}-expanded`} className="bg-stone-50/50">
                          <TableCell colSpan={9} className="p-6">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-bold text-[#E8621A] text-sm">Stack Trace:</h4>
                                <pre className="mt-1 bg-stone-900 text-stone-100 p-4 rounded-lg text-xs overflow-x-auto max-h-[300px] font-mono leading-relaxed">
                                  {rep.error_stack || "Nessun trace stack disponibile."}
                                </pre>
                              </div>
                              {rep.resolved && (
                                <div className="border-t pt-4">
                                  <h4 className="font-bold text-green-700 text-sm">Risoluzione:</h4>
                                  <p className="text-sm text-stone-600 mt-1">
                                    <span className="font-semibold">Risolto il:</span> {rep.resolved_at ? new Date(rep.resolved_at).toLocaleString("it-IT") : "N/D"}
                                  </p>
                                  <p className="text-sm text-stone-600 mt-1">
                                    <span className="font-semibold">Nota:</span> {rep.resolved_note || "Nessuna nota fornita."}
                                  </p>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    Nessun errore registrato con questo filtro.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Resolution Dialog */}
      <Dialog open={!!resolvingReport} onOpenChange={(open) => !open && setResolvingReport(null)}>
        <DialogContent className="sm:max-w-md">
          {resolvingReport && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-serif text-[#E8621A]">Risoluzione Errore</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleResolve} className="space-y-4 py-2">
                <div>
                  <Label>Tipo Errore</Label>
                  <p className="text-sm font-semibold text-stone-700 mt-1">{resolvingReport.error_type}</p>
                </div>
                <div>
                  <Label>Messaggio</Label>
                  <p className="text-sm text-stone-600 mt-1 bg-stone-50 border p-2 rounded-lg italic">{resolvingReport.error_message}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resNote">Nota di risoluzione</Label>
                  <Textarea id="resNote" value={resNote} onChange={(e) => setResNote(e.target.value)} placeholder="Descrivi il fix effettuato o la soluzione dell'anomalia." required />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setResolvingReport(null)}>Annulla</Button>
                  <Button type="submit" disabled={submitting} className="bg-[#E8621A] hover:bg-[#C94E0E] text-white">
                    {submitting ? "Salvataggio..." : "Segna come Risolto"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
