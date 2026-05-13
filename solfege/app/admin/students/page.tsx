"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Plus, Search, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StudentFormDialog } from "@/components/admin/student-form";

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  dob: string | null;
  active: boolean | null;
  parent_name: string | null;
  enrolled_at: string | null;
  [key: string]: any;
};

export default function StudentsPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch school_id e studenti
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", user.id)
        .single();

      if (!profile?.school_id) return;
      setSchoolId(profile.school_id);
      await fetchStudents(profile.school_id);
    }
    load();
  }, []);

  async function fetchStudents(sid?: string) {
    setLoading(true);
    const id = sid || schoolId;
    if (!id) return;

    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("school_id", id)
      .order("last_name", { ascending: true });

    if (!error && data) setStudents(data);
    setLoading(false);
  }

  function getAge(dob: string | null) {
    if (!dob) return null;
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }

  async function handleDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from("students").delete().eq("id", deleteId);
    if (error) {
      toast.error("Errore durante l'eliminazione");
    } else {
      toast.success("Allievo eliminato");
      fetchStudents();
    }
    setDeleteId(null);
  }

  const columns = useMemo<ColumnDef<Student>[]>(() => [
    {
      accessorFn: (row) => `${row.last_name} ${row.first_name}`,
      id: "nome",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting()} className="text-muted-foreground hover:text-foreground p-0">
          Nome <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-foreground">{row.original.last_name} {row.original.first_name}</p>
          {row.original.email && <p className="text-xs text-muted-foreground">{row.original.email}</p>}
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Telefono",
      cell: ({ getValue }) => <span className="text-foreground text-sm">{getValue() as string || "—"}</span>,
    },
    {
      accessorKey: "dob",
      header: "Età",
      cell: ({ getValue }) => {
        const age = getAge(getValue() as string | null);
        if (age === null) return <span className="text-muted-foreground text-sm">—</span>;
        return (
          <div className="flex items-center gap-2">
            <span className="text-foreground text-sm">{age} anni</span>
            {age < 18 && <Badge className="bg-amber-light text-amber border-0 text-[10px]">Minore</Badge>}
          </div>
        );
      },
    },
    {
      accessorKey: "active",
      header: "Stato",
      cell: ({ getValue }) => getValue() ?
        <Badge className="bg-green-light text-green border-0 text-xs">Attivo</Badge> :
        <Badge className="bg-red-light text-red border-0 text-xs">Inattivo</Badge>,
    },
    {
      accessorKey: "enrolled_at",
      header: "Iscrizione",
      cell: ({ getValue }) => {
        const val = getValue() as string | null;
        return <span className="text-muted-foreground text-sm">{val ? new Date(val).toLocaleDateString("it-IT") : "—"}</span>;
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => { setEditStudent(row.original); setDialogOpen(true); }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-red"
            onClick={() => setDeleteId(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data: students,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-4xl font-bold tracking-tight text-foreground">Studenti</h2>
        <Button
          className="bg-orange hover:bg-orange-dark text-white"
          onClick={() => { setEditStudent(undefined); setDialogOpen(true); }}
        >
          <Plus className="mr-2 h-4 w-4" /> Nuovo Allievo
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca per nome, email..."
          className="pl-10"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">Caricamento...</TableCell></TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">Nessun allievo trovato.</TableCell></TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30 border-border">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{table.getFilteredRowModel().rows.length} allievi totali</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="border-border text-muted-foreground">
            Precedente
          </Button>
          <span className="text-foreground font-medium">
            Pag. {table.getState().pagination.pageIndex + 1} di {table.getPageCount()}
          </span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="border-border text-muted-foreground">
            Successiva
          </Button>
        </div>
      </div>

      {/* Form Dialog */}
      {schoolId && (
        <StudentFormDialog
          key={editStudent?.id || "new"}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          schoolId={schoolId}
          student={editStudent}
          onSuccess={() => fetchStudents()}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Eliminare questo allievo?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Questa azione è irreversibile. Tutti i dati associati verranno rimossi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-muted-foreground">Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red hover:bg-red/90 text-white">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
