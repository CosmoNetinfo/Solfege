"use client";

import { AlertTriangle, Info } from "lucide-react";
import { formatDistanceToNow, isPast, addDays, isBefore } from "date-fns";
import { it } from "date-fns/locale";
import { Button } from "@/components/ui/button";

interface TrialBannerProps {
  trialEndsAt: string | null;
  plan: string | null;
}

export function TrialBanner({ trialEndsAt, plan }: TrialBannerProps) {
  // Mostriamo il banner solo se il piano è 'trial' (o se non c'è piano, assumiamo free/trial iniziale)
  if (plan !== 'trial' || !trialEndsAt) return null;

  const expiryDate = new Date(trialEndsAt);
  const isExpired = isPast(expiryDate);
  const isExpiringSoon = isBefore(expiryDate, addDays(new Date(), 7));

  if (!isExpired && !isExpiringSoon) return null;

  if (isExpired) {
    return (
      <div className="bg-red-600 text-white p-3 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
        <div className="flex items-center gap-2 font-bold">
          <AlertTriangle className="h-5 w-5" />
          <span>Il tuo periodo di prova è scaduto.</span>
        </div>
        <p className="text-sm opacity-90">
          Alcune funzioni di creazione sono state disabilitate. Attiva un piano per continuare.
        </p>
        <Button 
          variant="outline" 
          className="bg-white text-red-600 hover:bg-stone-100 border-none h-8 px-4 text-xs font-bold uppercase"
          onClick={() => window.location.href = '/admin/impostazioni'}
        >
          Attiva Ora
        </Button>
      </div>
    );
  }

  const distance = formatDistanceToNow(expiryDate, { locale: it, addSuffix: true });

  return (
    <div className="bg-amber-500 text-white p-3 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
      <div className="flex items-center gap-2 font-bold">
        <Info className="h-5 w-5" />
        <span>Il tuo trial scade {distance}.</span>
      </div>
      <p className="text-sm opacity-90">
        Passa a Starter da €14/mese per non perdere l'accesso alle funzioni avanzate.
      </p>
      <Button 
        variant="outline" 
        className="bg-white text-amber-600 hover:bg-stone-100 border-none h-8 px-4 text-xs font-bold uppercase"
        onClick={() => window.location.href = '/admin/impostazioni'}
      >
        Vedi Piani
      </Button>
    </div>
  );
}
