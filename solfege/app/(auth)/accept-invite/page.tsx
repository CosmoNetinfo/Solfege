"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function AcceptInvitePage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuth() {
      // 1. Controlla se c'è un codice nell'URL (PKCE)
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        console.log('[ACCEPT-INVITE] Scambio codice per sessione...');
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error('[ACCEPT-INVITE] Errore scambio codice:', exchangeError);
          // Non blocchiamo, proviamo comunque a vedere se c'è una sessione già esistente
        }
      }

      // 2. Verifica sessione e ottieni email
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? null);
        
        // 3. Logica di associazione profilo
        const { teacher_id, role } = user.user_metadata || {};
        if (role === 'insegnante' && teacher_id) {
          console.log('[ACCEPT-INVITE] Associazione profilo insegnante...');
          await supabase.from('profiles').update({ role: 'insegnante' }).eq('id', user.id);
          await supabase.from('teachers').update({ profile_id: user.id }).eq('id', teacher_id);
        }
      }
    }

    handleAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

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
          {userEmail && (
            <div className="mt-2 p-2 bg-orange/5 rounded border border-orange/10">
              <p className="text-xs text-muted-foreground uppercase font-bold">Email account:</p>
              <p className="text-sm font-medium text-foreground">{userEmail}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nuova Password</Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Conferma Password</Label>
            <Input 
              id="confirmPassword" 
              type={showPassword ? "text" : "password"} 
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
