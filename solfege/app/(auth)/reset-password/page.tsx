"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Supabase intercetta automaticamente il token di recupero dal fragment dell'URL (#access_token=...&type=recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
          setIsReady(true);
        }
      }
    );

    // Controlla se una sessione è già attiva
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setIsReady(true);
      }
    });

    // Timeout di sicurezza nel caso in cui non arrivi alcun token
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 2500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (password.length < 8) {
      setErrorMessage("La password deve contenere almeno 8 caratteri.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Le password non coincidono.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setErrorMessage(error.message || "Errore durante l'aggiornamento della password.");
        return;
      }

      setIsSuccess(true);
      toast.success("Password reimpostata con successo!");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || "Si è verificato un errore inaspettato.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-orange" />
        <p className="text-sm text-muted-foreground">Verifica del link di recupero in corso...</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center animate-in fade-in duration-300">
        <div className="mx-auto w-12 h-12 rounded-full bg-green/10 flex items-center justify-center text-green">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-3xl font-bold text-foreground">Password aggiornata!</h2>
          <p className="text-muted-foreground text-sm">
            La tua nuova password è attiva. Reindirizzamento al login in corso...
          </p>
        </div>
        <Link href="/login" className="inline-block">
          <Button className="bg-orange hover:bg-orange-dark text-white font-serif text-sm">
            Vai al login subito
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="space-y-2">
        <h2 className="font-serif text-3xl font-bold text-foreground">Nuova Password</h2>
        <p className="text-muted-foreground text-sm">
          Inserisci la tua nuova password per accedere a Solfège.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red/5 border border-red/20 rounded-xl text-red text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nuova password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimo 8 caratteri"
                className="pl-10 pr-10 border-border"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Conferma nuova password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="Ripeti la nuova password"
                className="pl-10 pr-10 border-border"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-orange hover:bg-orange-dark text-white h-11 font-serif text-sm tracking-wide"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salva nuova password"}
        </Button>
      </form>

      <div className="text-center text-sm pt-2">
        <Link href="/login" className="text-muted-foreground hover:text-foreground text-xs">
          &larr; Torna al login
        </Link>
      </div>
    </div>
  );
}
