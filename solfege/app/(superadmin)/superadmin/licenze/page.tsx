"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Key, Copy, Check, Eye, Monitor, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface License {
  id: string;
  license_key: string;
  customer_name: string;
  customer_email: string;
  customer_whatsapp: string | null;
  status: "inactive" | "active" | "revoked";
  activated_at: string | null;
  machine_id: string | null;
  app_version: string | null;
  os_info: string | null;
  notes: string | null;
  created_at: string;
}

interface LicenseActivation {
  id: string;
  license_key: string;
  machine_id: string;
  app_version: string | null;
  os_info: string | null;
  activated_at: string;
  last_seen_at: string;
}

const MAX_DEVICES = 3;

export default function LicenzePage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Dialog generator state
  const [genDialogOpen, setGenDialogOpen] = useState(false);
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custWhatsApp, setCustWhatsApp] = useState("");
  const [custNotes, setCustNotes] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Detail dialog state
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [activations, setActivations] = useState<LicenseActivation[]>([]);
  const [activationsLoading, setActivationsLoading] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("licenses" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[licenze] Supabase error:", error.message, error.code);
    } else if (data) {
      setLicenses(data as unknown as License[]);
    }
    setLoading(false);
  }, [supabase]);

  const fetchActivations = useCallback(async (licenseKey: string) => {
    setActivationsLoading(true);
    const { data, error } = await supabase
      .from("license_activations" as any)
      .select("*")
      .eq("license_key", licenseKey)
      .order("activated_at", { ascending: true });

    if (!error && data) {
      setActivations(data as unknown as LicenseActivation[]);
    }
    setActivationsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  const handleOpenDetail = (lic: License) => {
    setSelectedLicense(lic);
    setActivations([]);
    fetchActivations(lic.license_key);
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/superadmin/generate-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: custName,
          customer_email: custEmail,
          customer_whatsapp: custWhatsApp || undefined,
          notes: custNotes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Errore nella generazione della licenza");
      }

      setGeneratedKey(data.license_key);
      fetchLicenses();
      setCustName("");
      setCustEmail("");
      setCustWhatsApp("");
      setCustNotes("");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setGenLoading(false);
    }
  };

  const handleRevoke = async (id: string, key: string) => {
    if (!confirm(`Sei sicuro di voler revocare la licenza ${key}? L'applicazione del cliente smetterà di funzionare.`)) {
      return;
    }

    const { error } = await supabase
      .from("licenses" as any)
      .update({ status: "revoked", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      fetchLicenses();
      if (selectedLicense && selectedLicense.id === id) {
        setSelectedLicense(prev => prev ? { ...prev, status: "revoked" } : null);
      }
    } else {
      alert("Errore durante la revoca: " + error.message);
    }
  };

  const handleDeactivateDevice = async (activation: LicenseActivation) => {
    const shortId = activation.machine_id.slice(0, 12) + "...";
    if (!confirm(`Rimuovere il dispositivo ${shortId}? Il cliente potrà riattivare su un nuovo dispositivo.`)) {
      return;
    }

    setDeactivatingId(activation.id);
    const { error } = await supabase
      .from("license_activations" as any)
      .delete()
      .eq("id", activation.id);

    if (!error) {
      setActivations(prev => prev.filter(a => a.id !== activation.id));
      // Se non ci sono più attivazioni, aggiorna lo stato della licenza a inactive
      const remaining = activations.filter(a => a.id !== activation.id);
      if (remaining.length === 0 && selectedLicense) {
        await supabase
          .from("licenses" as any)
          .update({ status: "inactive", updated_at: new Date().toISOString() })
          .eq("license_key", selectedLicense.license_key);
        setSelectedLicense(prev => prev ? { ...prev, status: "inactive" } : null);
        fetchLicenses();
      }
    } else {
      alert("Errore durante la disattivazione: " + error.message);
    }
    setDeactivatingId(null);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif text-[#E8621A] font-bold">Gestione Licenze</h1>
          <p className="text-muted-foreground mt-2">
            Genera, monitora e revoca le licenze desktop dei clienti. Ogni licenza supporta fino a {MAX_DEVICES} dispositivi.
          </p>
        </div>

        <Dialog open={genDialogOpen} onOpenChange={(open) => {
          setGenDialogOpen(open);
          if (!open) {
            setGeneratedKey(null);
            setErrorMsg(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#E8621A] hover:bg-[#C94E0E] text-white">
              <Key className="mr-2 h-4 w-4" /> Genera Licenza
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-serif">Nuova Licenza Solfège</DialogTitle>
            </DialogHeader>

            {generatedKey ? (
              <div className="space-y-6 py-4 text-center">
                <p className="text-sm text-muted-foreground">La licenza è stata generata correttamente:</p>
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 font-mono text-lg font-bold flex items-center justify-center gap-3">
                  <span>{generatedKey}</span>
                  <Button size="icon" variant="ghost" onClick={() => handleCopy(generatedKey)}>
                    {copiedKey === generatedKey ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5 text-stone-600" />}
                  </Button>
                </div>
                <Button className="w-full bg-[#E8621A] hover:bg-[#C94E0E] text-white" onClick={() => setGenDialogOpen(false)}>
                  Fatto
                </Button>
              </div>
            ) : (
              <form onSubmit={handleGenerateLicense} className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Cliente</Label>
                  <Input id="name" required value={custName} onChange={(e) => setCustName(e.target.value)} placeholder="Scuola Musicale Verdi" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Cliente</Label>
                  <Input id="email" type="email" required value={custEmail} onChange={(e) => setCustEmail(e.target.value)} placeholder="direzione@scuolaverdi.it" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp (Opzionale)</Label>
                  <Input id="whatsapp" value={custWhatsApp} onChange={(e) => setCustWhatsApp(e.target.value)} placeholder="+39 333 1234567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Note (Opzionale)</Label>
                  <Textarea id="notes" value={custNotes} onChange={(e) => setCustNotes(e.target.value)} placeholder="Eventuali annotazioni o accordi commerciali." />
                </div>

                {errorMsg && <p className="text-sm text-red-600 font-semibold">{errorMsg}</p>}

                <Button type="submit" disabled={genLoading} className="w-full bg-[#E8621A] hover:bg-[#C94E0E] text-white">
                  {genLoading ? "Generazione in corso..." : "Conferma e Genera"}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabella Licenze */}
      <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Caricamento licenze...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Key</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Prima attivazione</TableHead>
                <TableHead>Dispositivi</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.length > 0 ? (
                licenses.map((lic) => (
                  <TableRow key={lic.id}>
                    <TableCell className="font-mono font-bold text-sm">
                      <div className="flex items-center gap-2">
                        <span>{lic.license_key}</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleCopy(lic.license_key)}>
                          {copiedKey === lic.license_key ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{lic.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{lic.customer_email}</div>
                    </TableCell>
                    <TableCell>
                      {lic.status === "active" && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Attiva</Badge>}
                      {lic.status === "inactive" && <Badge className="bg-stone-100 text-stone-600 hover:bg-stone-100 border-none">Inattiva</Badge>}
                      {lic.status === "revoked" && <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">Revocata</Badge>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {lic.activated_at ? new Date(lic.activated_at).toLocaleDateString("it-IT", { dateStyle: "short" }) : "N/D"}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1.5">
                        <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {lic.status === "active" ? "≥1" : "0"}/{MAX_DEVICES}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleOpenDetail(lic)}>
                        <Eye className="h-4 w-4 mr-1" /> Dettagli
                      </Button>
                      {lic.status !== "revoked" && (
                        <Button size="sm" variant="destructive" onClick={() => handleRevoke(lic.id, lic.license_key)}>
                          Revoca
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Nessuna licenza presente nel sistema.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialog Dettagli Licenza */}
      <Dialog open={!!selectedLicense} onOpenChange={(open) => !open && setSelectedLicense(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedLicense && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-serif text-[#E8621A]">Dettagli Licenza</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-2 text-sm">

                {/* Info generali */}
                <div className="grid grid-cols-3 gap-2 py-2 border-b">
                  <span className="font-bold text-muted-foreground">License Key:</span>
                  <span className="col-span-2 font-mono font-bold">{selectedLicense.license_key}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 py-2 border-b">
                  <span className="font-bold text-muted-foreground">Cliente:</span>
                  <span className="col-span-2">{selectedLicense.customer_name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 py-2 border-b">
                  <span className="font-bold text-muted-foreground">Email:</span>
                  <span className="col-span-2">{selectedLicense.customer_email}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 py-2 border-b">
                  <span className="font-bold text-muted-foreground">WhatsApp:</span>
                  <span className="col-span-2">{selectedLicense.customer_whatsapp || "–"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 py-2 border-b">
                  <span className="font-bold text-muted-foreground">Stato:</span>
                  <span className="col-span-2">
                    <Badge variant={selectedLicense.status === "active" ? "default" : selectedLicense.status === "revoked" ? "destructive" : "secondary"}>
                      {selectedLicense.status === "active" ? "Attiva" : selectedLicense.status === "revoked" ? "Revocata" : "Inattiva"}
                    </Badge>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 py-2 border-b">
                  <span className="font-bold text-muted-foreground">Generata il:</span>
                  <span className="col-span-2">{new Date(selectedLicense.created_at).toLocaleString("it-IT")}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 py-2 border-b">
                  <span className="font-bold text-muted-foreground">Prima attivazione:</span>
                  <span className="col-span-2">{selectedLicense.activated_at ? new Date(selectedLicense.activated_at).toLocaleString("it-IT") : "–"}</span>
                </div>
                {selectedLicense.notes && (
                  <div className="flex flex-col gap-2 py-2 border-b">
                    <span className="font-bold text-muted-foreground">Note:</span>
                    <span className="bg-stone-50 border p-3 rounded-lg text-xs italic">{selectedLicense.notes}</span>
                  </div>
                )}

                {/* Sezione Dispositivi */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-[#E8621A]" />
                      Dispositivi Attivi
                    </h3>
                    {!activationsLoading && (
                      <span className="text-xs text-muted-foreground">
                        {activations.length} / {MAX_DEVICES} slot utilizzati
                      </span>
                    )}
                  </div>

                  {activationsLoading ? (
                    <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Caricamento dispositivi...</span>
                    </div>
                  ) : activations.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm bg-stone-50 rounded-lg border border-dashed">
                      Nessun dispositivo attivato per questa licenza.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activations.map((act, idx) => (
                        <div key={act.id} className="flex items-start justify-between bg-stone-50 border border-stone-200 rounded-lg p-3 gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="bg-[#E8621A]/10 text-[#E8621A] rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <div className="font-mono text-xs text-foreground font-medium truncate">
                                {act.machine_id.slice(0, 20)}…
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {act.os_info} · v{act.app_version}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Attivato: {formatDate(act.activated_at)}
                                {act.last_seen_at !== act.activated_at && (
                                  <span className="ml-2">· Ultimo uso: {formatDate(act.last_seen_at)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                            disabled={deactivatingId === act.id}
                            onClick={() => handleDeactivateDevice(act)}
                          >
                            {deactivatingId === act.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Trash2 className="h-4 w-4" />
                            }
                            <span className="ml-1 text-xs">Disattiva</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Slot liberi visivi */}
                {!activationsLoading && activations.length < MAX_DEVICES && (
                  <div className="flex gap-2 pt-1">
                    {Array.from({ length: MAX_DEVICES - activations.length }).map((_, i) => (
                      <div key={i} className="flex-1 border border-dashed border-stone-300 rounded-lg h-10 flex items-center justify-center text-xs text-stone-400">
                        Slot libero
                      </div>
                    ))}
                  </div>
                )}

                {/* Azioni */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  {selectedLicense.status !== "revoked" && (
                    <Button variant="destructive" onClick={() => handleRevoke(selectedLicense.id, selectedLicense.license_key)}>
                      Revoca Licenza
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setSelectedLicense(null)}>
                    Chiudi
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
