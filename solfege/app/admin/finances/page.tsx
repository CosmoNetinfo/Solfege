"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, 
  Search, 
  Download, 
  Printer, 
  Share2, 
  Mail, 
  MoreHorizontal,
  Banknote,
  Clock,
  AlertCircle,
  TrendingUp,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getPayments, getFinancesSummary, getSchoolData } from "@/lib/supabase/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";

// Componente isolato per scaricare il PDF (evita errori SSR Turbopack)
const PDFButton = dynamic(() => import("@/components/admin/PDFButton"), { ssr: false });

export default function FinancesPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState({ collectedMonth: 0, pendingTotal: 0, overdueTotal: 0 });
  const [school, setSchool] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("tutti");
  
  // State per il modal "Segna come Pagato"
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("bonifico");
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    loadData();
  }, [statusTab]);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", user.id)
      .single();
      
    if (!profile?.school_id) return;
    
    const [paymentsData, summaryData, schoolData] = await Promise.all([
      getPayments(supabase, profile.school_id, { status: statusTab }),
      getFinancesSummary(supabase, profile.school_id),
      getSchoolData(supabase, profile.school_id)
    ]);
    
    setPayments(paymentsData);
    setSummary(summaryData);
    setSchool(schoolData);
    setLoading(false);
  }

  const filteredPayments = payments.filter(p => 
    `${p.students?.first_name} ${p.students?.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    p.numero_ricevuta?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleMarkAsPaid() {
    if (!selectedPayment) return;
    
    try {
      // Generiamo un numero ricevuta fittizio ma progressivo (per ora anno-numero)
      const year = new Date().getFullYear();
      const { count } = await supabase
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("school_id", school.id)
        .eq("status", "pagato")
        .gte("paid_date", `${year}-01-01`);
      
      const receiptNumber = `${year}-${String((count || 0) + 1).padStart(3, "0")}`;
      
      const { error } = await supabase
        .from("payments")
        .update({
          status: "pagato",
          paid_date: paidDate,
          method: paymentMethod as any,
          numero_ricevuta: receiptNumber,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedPayment.id);
        
      if (error) throw error;
      
      toast.success("Pagamento registrato con successo");
      setIsPayModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error("Errore: " + err.message);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pagato":
        return <Badge className="bg-green-light text-green border-green/20">Pagato</Badge>;
      case "in_attesa":
        return <Badge className="bg-amber-light text-amber border-amber/20">In Attesa</Badge>;
      case "in_ritardo":
        return <Badge className="bg-red-light text-red border-red/20">In Ritardo</Badge>;
      case "annullato":
        return <Badge variant="outline" className="text-muted-foreground line-through">Annullato</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-4xl font-bold tracking-tight text-foreground">Finanze</h2>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border text-muted-foreground">
            <Download className="mr-2 h-4 w-4" /> Esporta CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Incassato Mese</CardTitle>
            <TrendingUp className="h-4 w-4 text-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">€ {summary.collectedMonth.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Ricevute pagate nel mese corrente</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Attesa</CardTitle>
            <Clock className="h-4 w-4 text-amber" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">€ {summary.pendingTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Pagamenti futuri o non ancora scaduti</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Ritardo</CardTitle>
            <AlertCircle className="h-4 w-4 text-red" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">€ {summary.overdueTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Pagamenti scaduti e non saldati</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="tutti" onValueChange={setStatusTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="bg-stone-100 border border-border">
            <TabsTrigger value="tutti">Tutti</TabsTrigger>
            <TabsTrigger value="in_attesa">In Attesa</TabsTrigger>
            <TabsTrigger value="in_ritardo">In Ritardo</TabsTrigger>
            <TabsTrigger value="pagato">Pagati</TabsTrigger>
          </TabsList>

          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cerca allievo o ricevuta..." 
              className="pl-10 h-9" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value={statusTab} className="border rounded-lg bg-surface">
          <Table>
            <TableHeader className="bg-stone-50/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[120px] text-muted-foreground font-semibold">N° Ricevuta</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Allievo</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Corso</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Importo</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Scadenza</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Stato</TableHead>
                <TableHead className="text-right text-muted-foreground font-semibold">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Caricamento pagamenti...
                  </TableCell>
                </TableRow>
              ) : filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Nessun pagamento trovato.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((p) => (
                  <TableRow key={p.id} className="border-border hover:bg-stone-50/30 transition-colors">
                    <TableCell className="font-mono text-xs text-orange">
                      {p.numero_ricevuta || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {p.students?.last_name} {p.students?.first_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {p.enrollments?.courses?.name || p.description || "Iscrizione"}
                    </TableCell>
                    <TableCell className="font-bold text-foreground">
                      € {Number(p.amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(p.due_date), "dd MMM yyyy", { locale: it })}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(p.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-surface border-border">
                          <DropdownMenuLabel>Azioni</DropdownMenuLabel>
                          {p.status !== "pagato" && (
                            <DropdownMenuItem 
                              className="text-green focus:text-green cursor-pointer"
                              onClick={() => {
                                setSelectedPayment(p);
                                setIsPayModalOpen(true);
                              }}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Segna come Pagato
                            </DropdownMenuItem>
                          )}
                          {p.status === "pagato" && school && (
                            <PDFButton school={school} payment={p} />
                          )}
                          <DropdownMenuItem className="cursor-pointer">
                            <Mail className="mr-2 h-4 w-4" /> Invia Sollecito
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red focus:text-red cursor-pointer">
                            Annulla Pagamento
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* Modal Segna come Pagato */}
      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-foreground font-serif text-xl">Registra Pagamento</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Conferma l'incasso di <strong>€ {selectedPayment?.amount?.toFixed(2)}</strong> da parte di {selectedPayment?.students?.first_name} {selectedPayment?.students?.last_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Metodo di Pagamento</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Seleziona metodo" />
                </SelectTrigger>
                <SelectContent className="bg-surface border-border">
                  <SelectItem value="contanti">Contanti</SelectItem>
                  <SelectItem value="bonifico">Bonifico</SelectItem>
                  <SelectItem value="carta">Carta di Credito/Debito</SelectItem>
                  <SelectItem value="altro">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Data Pagamento</label>
              <Input 
                type="date" 
                className="border-border" 
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayModalOpen(false)} className="border-border text-muted-foreground">Annulla</Button>
            <Button className="bg-green hover:bg-green/90 text-white" onClick={handleMarkAsPaid}>Conferma Pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
