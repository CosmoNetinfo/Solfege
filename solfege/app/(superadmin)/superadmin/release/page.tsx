"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Download, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AppRelease {
  id: string;
  version: string;
  release_notes: string;
  windows_url: string | null;
  mac_url: string | null;
  linux_url: string | null;
  is_current: boolean;
  published_at: string;
}

export default function ReleasePage() {
  const [releases, setReleases] = useState<AppRelease[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [winUrl, setWinUrl] = useState("");
  const [macUrl, setMacUrl] = useState("");
  const [linUrl, setLinUrl] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const supabase = createClient();

  const fetchReleases = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("app_releases" as any)
      .select("*")
      .order("published_at", { ascending: false });

    if (!error && data) {
      setReleases(data as unknown as AppRelease[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/superadmin/publish-release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version,
          release_notes: notes,
          windows_url: winUrl || undefined,
          mac_url: macUrl || undefined,
          linux_url: linUrl || undefined,
          is_current: isCurrent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Errore nella pubblicazione della release");
      }

      fetchReleases();
      // Reset form
      setVersion("");
      setNotes("");
      setWinUrl("");
      setMacUrl("");
      setLinUrl("");
      setIsCurrent(false);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-serif text-[#E8621A] font-bold">Gestione Release</h1>
        <p className="text-muted-foreground mt-2">Pubblica e gestisci le versioni dell'applicazione desktop.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Release Form */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-xl font-serif font-bold text-foreground">Nuova Release</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="version">Versione (es. 1.0.0)</Label>
                <Input id="version" required value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.0" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Note di rilascio</Label>
                <Textarea id="notes" required value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="- Risolto bug calendario\n- Velocizzato caricamento" className="h-32" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="win">URL Windows (.exe)</Label>
                <Input id="win" type="url" value={winUrl} onChange={(e) => setWinUrl(e.target.value)} placeholder="https://github.com/...exe" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mac">URL Mac (.dmg)</Label>
                <Input id="mac" type="url" value={macUrl} onChange={(e) => setMacUrl(e.target.value)} placeholder="https://github.com/...dmg" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linux">URL Linux (.AppImage)</Label>
                <Input id="linux" type="url" value={linUrl} onChange={(e) => setLinUrl(e.target.value)} placeholder="https://github.com/...AppImage" />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="current" checked={isCurrent} onCheckedChange={(checked: boolean) => setIsCurrent(checked)} />
                <Label htmlFor="current" className="text-sm font-medium cursor-pointer">Imposta come versione corrente</Label>
              </div>

              {errorMsg && <p className="text-sm text-red-600 font-semibold">{errorMsg}</p>}

              <Button type="submit" disabled={submitting} className="w-full bg-[#E8621A] hover:bg-[#C94E0E] text-white">
                {submitting ? "Pubblicazione..." : "Pubblica Release"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* History Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl font-serif font-bold text-foreground">Storico Release</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-muted-foreground">Caricamento storico...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Versione</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Link Download</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead className="text-right">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {releases.length > 0 ? (
                      releases.map((rel) => (
                        <TableRow key={rel.id}>
                          <TableCell className="font-bold text-base flex items-center gap-2">
                            <Package className="h-4 w-4 text-stone-500" />
                            <span>v{rel.version}</span>
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate whitespace-pre-line">
                            {rel.release_notes}
                          </TableCell>
                          <TableCell className="space-y-1">
                            {rel.windows_url && (
                              <a href={rel.windows_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-orange hover:underline">
                                <Download className="h-3 w-3" /> Windows
                              </a>
                            )}
                            {rel.mac_url && (
                              <a href={rel.mac_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-orange hover:underline">
                                <Download className="h-3 w-3" /> Mac
                              </a>
                            )}
                            {rel.linux_url && (
                              <a href={rel.linux_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-orange hover:underline">
                                <Download className="h-3 w-3" /> Linux
                              </a>
                            )}
                            {!rel.windows_url && !rel.mac_url && !rel.linux_url && (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {rel.is_current ? (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Corrente</Badge>
                            ) : (
                              <Badge className="bg-stone-100 text-stone-600 hover:bg-stone-100 border-none">Precedente</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {new Date(rel.published_at).toLocaleDateString("it-IT")}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          Nessuna release pubblicata.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
