'use client';

import { useState, useEffect } from "react";
import { format, setMonth } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getTeacherCompensations, markCompensationAsPaid } from "@/lib/supabase/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

export function CompensationsTable({ schoolId }: { schoolId: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [month, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [year, setSelectedYear] = useState(new Date().getFullYear());
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [month, year]);

  async function loadData() {
    setLoading(true);
    try {
      const compensations = await getTeacherCompensations(supabase, schoolId, month, year);
      setData(compensations);
    } catch (error: any) {
      toast.error("Errore nel caricamento dei compensi");
    } finally {
      setLoading(false);
    }
  }

  const handleTogglePaid = async (comp: any) => {
    try {
      const newPaidStatus = !comp.paid;
      await markCompensationAsPaid(
        supabase, 
        schoolId, 
        comp.teacher.id, 
        month, 
        year, 
        comp.hours_individual, 
        comp.hours_group, 
        comp.total_amount, 
        newPaidStatus
      );
      
      toast.success(newPaidStatus ? "Compenso segnato come pagato" : "Pagamento annullato");
      loadData();
    } catch (error: any) {
      toast.error("Errore durante l'aggiornamento");
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setSelectedMonth(1);
      setSelectedYear(year + 1);
    } else {
      setSelectedMonth(month + 1);
    }
  };

  const prevMonth = () => {
    if (month === 1) {
      setSelectedMonth(12);
      setSelectedYear(year - 1);
    } else {
      setSelectedMonth(month - 1);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 border-[#E8E4E0] bg-surface flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} className="h-9 w-9 border-[#E8E4E0]">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex gap-2">
            <Select value={month.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-[140px] capitalize font-medium border-[#E8E4E0]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface border-[#E8E4E0]">
                {Array.from({ length: 12 }).map((_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()} className="capitalize">
                    {format(setMonth(new Date(), i), "MMMM", { locale: it })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[100px] font-medium border-[#E8E4E0]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface border-[#E8E4E0]">
                {Array.from({ length: 5 }).map((_, i) => {
                  const y = new Date().getFullYear() - 2 + i;
                  return <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                })}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-9 w-9 border-[#E8E4E0]">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <div className="border border-[#E8E4E0] rounded-xl overflow-hidden bg-surface">
        <Table>
          <TableHeader className="bg-stone-50/50">
            <TableRow className="border-[#E8E4E0]">
              <TableHead className="font-semibold text-muted-foreground">Docente</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-center">Ore Individuali</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-center">Ore Collettive</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-right">Totale Calcolato</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-center">Stato</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#E8621A]" />
                  <p className="text-muted-foreground mt-2 text-sm">Calcolo compensi in corso...</p>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Nessun docente attivo trovato.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, idx) => (
                <TableRow key={idx} className="hover:bg-stone-50/50 border-[#E8E4E0]">
                  <TableCell className="font-medium text-[#1A1714]">
                    {item.teacher.first_name} {item.teacher.last_name}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.hours_individual > 0 ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {item.hours_individual.toFixed(1)} h
                      </Badge>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.hours_group > 0 ? (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {item.hours_group.toFixed(1)} h
                      </Badge>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="text-right font-bold text-[#E8621A] text-lg">
                    € {item.total_amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.paid ? (
                      <Badge className="bg-green-light text-green border-green/20">Pagato</Badge>
                    ) : (
                      <Badge className="bg-amber-light text-amber border-amber/20">Da pagare</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleTogglePaid(item)}
                      className={item.paid ? "text-red border-red/20 hover:text-red hover:bg-red/10" : "text-green border-green/20 hover:text-green hover:bg-green/10"}
                    >
                      {item.paid ? (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Annulla
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Segna Pagato
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
