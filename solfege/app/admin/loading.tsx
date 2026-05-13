import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex h-[70vh] w-full flex-col items-center justify-center gap-4">
      <div className="relative">
        <Loader2 className="h-12 w-12 animate-spin text-[#E8621A]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-4 rounded-full bg-stone-100" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-lg font-medium text-[#1A1714]">Caricamento dati...</p>
        <p className="text-sm text-muted-foreground italic">Preparazione del tuo conservatorio digitale</p>
      </div>
    </div>
  );
}
