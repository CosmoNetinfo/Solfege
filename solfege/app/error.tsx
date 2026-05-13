'use client';

import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global boundary caught an error:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-stone-50 p-6">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
        </div>
        <h1 className="mb-3 font-serif text-3xl font-bold text-[#1A1714]">Si è verificato un errore</h1>
        <p className="mb-8 text-muted-foreground">
          Siamo spiacenti, c'è stato un problema imprevisto durante il caricamento della pagina. Il nostro team è stato notificato.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button 
            onClick={() => reset()} 
            className="bg-[#E8621A] hover:bg-[#C94E0E] text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Riprova
          </Button>
          <Button variant="outline" asChild className="border-[#E8E4E0] text-[#7A736C]">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Torna alla Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
