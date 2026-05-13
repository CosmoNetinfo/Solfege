'use client';

import Link from "next/link";
import { Search, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-stone-50 p-6">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-stone-200 p-6">
            <Search className="h-16 w-16 text-[#7A736C]" />
          </div>
        </div>
        <h1 className="mb-2 font-serif text-6xl font-bold text-[#1A1714]">404</h1>
        <h2 className="mb-4 text-2xl font-medium text-[#1A1714]">Pagina non trovata</h2>
        <p className="mb-8 text-muted-foreground">
          La pagina che stai cercando potrebbe essere stata rimossa, ha cambiato nome, o è temporaneamente non disponibile.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button 
            asChild
            className="bg-[#E8621A] hover:bg-[#C94E0E] text-white"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Torna alla Home
            </Link>
          </Button>
          <Button variant="outline" asChild className="border-[#E8E4E0] text-[#7A736C]">
            <button onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Torna indietro
            </button>
          </Button>
        </div>
      </div>
    </div>
  );
}
