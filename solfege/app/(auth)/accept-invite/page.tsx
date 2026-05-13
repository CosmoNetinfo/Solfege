"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AcceptInvitePage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("La password deve essere di almeno 6 caratteri.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Le password non coincidono.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast.success("Password impostata con successo!");
      // Il redirect verrà gestito dal callback o possiamo farlo qui
      router.push("/teacher/home");
    } catch (err: any) {
      toast.error(err.message || "Errore durante l'impostazione della password");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-border/50">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif font-bold text-foreground">Benvenuto!</h1>
          <p className="text-muted-foreground">Scegli la tua password per accedere al portale Solfège.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nuova Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Conferma Password</Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-orange hover:bg-orange-dark text-white py-6 text-lg" 
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Inizia ad usare Solfège"}
          </Button>
        </form>
      </div>
    </div>
  );
}
