"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("Inserisci un'email valida"),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Debug panel — reads session info from the API route after login
function DebugPanel() {
  const searchParams = useSearchParams();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const showDebug = searchParams.get("debug") === "1";

  useEffect(() => {
    if (!showDebug) return;
    fetch("/api/debug/session")
      .then((r) => r.json())
      .then(setDebugInfo)
      .catch((e) => setDebugInfo({ error: e.message }));
  }, [showDebug]);

  if (!showDebug) return null;

  return (
    <div style={{
      background: "#1a1a2e",
      border: "1px solid #ff4444",
      borderRadius: 8,
      padding: 16,
      marginTop: 16,
      fontSize: 12,
      fontFamily: "monospace",
      color: "#fff",
      whiteSpace: "pre-wrap",
      wordBreak: "break-all",
    }}>
      <strong style={{ color: "#ff8800" }}>[DEBUG SESSION]</strong>
      <br />
      {debugInfo ? JSON.stringify(debugInfo, null, 2) : "Caricamento..."}
    </div>
  );
}

function LoginFormContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const errorParam = searchParams.get('error');
  const codeParam = searchParams.get('code');
  const typeParam = searchParams.get('type');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  function log(msg: string) {
    console.log("[AUTH DEBUG]", msg);
    setDebugLog((prev) => [...prev, `${new Date().toISOString().slice(11,19)} ${msg}`]);
  }

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setDebugLog([]);
    try {
      log("Chiamata signInWithPassword...");
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        log(`ERRORE auth: ${error.message}`);
        toast.error("Credenziali non valide. Riprova.");
        return;
      }

      log("Login completato. Recupero profilo...");
      const { data: profile, error: profError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profError) {
        log(`ERRORE profilo: ${profError.message}`);
      }

      log(`Ruolo trovato: ${profile?.role}`);
      if (profile?.role === "superadmin") {
        log("Redirecting to /superadmin...");
        router.push("/superadmin");
      } else if (profile?.role === "insegnante") {
        log("Redirecting to /teacher/home...");
        router.push("/teacher/home");
      } else {
        log("Redirecting to /admin/dashboard...");
        router.push("/admin/dashboard");
      }
    } catch (err: any) {
      log(`ECCEZIONE: ${err.message}`);
      toast.error("Si è verificato un errore inaspettato.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDemoLogin() {
    setIsLoading(true);
    setDebugLog([]);
    try {
      log("Chiamata signInWithPassword per account Demo...");
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: "demo@solfege.it",
        password: "demo123456",
      });

      if (error) {
        log(`ERRORE demo: ${error.message}`);
        toast.error("Impossibile accedere alla demo. Verifica che l'utente demo@solfege.it sia attivo.");
        return;
      }

      log("Login completato. Reindirizzamento a dashboard...");
      router.push("/admin/dashboard");
    } catch (err: any) {
      log(`ECCEZIONE: ${err.message}`);
      toast.error("Si è verificato un errore durante l'accesso demo.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="font-serif text-3xl font-bold text-foreground">Bentornato</h2>
        <p className="text-muted-foreground text-sm">Inserisci le tue credenziali per accedere al portale.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="nome@scuola.it"
                className="pl-10 border-border"
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-red text-xs">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                className="pl-10 pr-10 border-border"
                {...register("password")}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red text-xs">{errors.password.message}</p>}
          </div>
        </div>

        <div className="space-y-3">
          <Button
            type="submit"
            className="w-full bg-orange hover:bg-orange-dark text-white h-11 font-serif text-sm tracking-wide"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Accedi"}
          </Button>

          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <span className="relative bg-surface px-3 text-[10px] uppercase text-muted-foreground font-bold">Oppure</span>
          </div>

          <Button
            type="button"
            onClick={handleDemoLogin}
            className="w-full bg-stone-900 hover:bg-stone-850 text-white border border-[#2D2A27] h-11 font-serif text-sm tracking-wide"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Prova la Demo Online (Sola Lettura)"}
          </Button>
        </div>
      </form>

      {/* Debug log visibile dopo il login */}
      {debugLog.length > 0 && (
        <div style={{
          background: "#0f0f1a",
          border: "1px solid #333",
          borderRadius: 8,
          padding: 12,
          fontSize: 11,
          fontFamily: "monospace",
          color: "#aaffaa",
          whiteSpace: "pre-wrap",
        }}>
          <strong style={{ color: "#ffaa00" }}>[Auth Log]</strong>
          <br />
          {debugLog.join("\n")}
        </div>
      )}

      {/* Pannello debug sessione — visitare /login?debug=1 dopo il login */}
      <Suspense fallback={null}>
        <DebugPanel />
      </Suspense>

      {/* Box di Debug per tracciare i reindirizzamenti falliti */}
      {(errorParam || codeParam || typeParam) && (
        <div className="p-4 bg-red/5 border border-red/10 rounded-lg text-xs font-mono text-red-700 space-y-1">
          <p className="font-bold uppercase mb-1">Dati di Debug:</p>
          <p>Errore: {errorParam || 'nessuno'}</p>
          <p>Codice Auth: {codeParam ? 'presente' : 'assente'}</p>
          <p>Tipo: {typeParam || 'nessuno'}</p>
          <p>Se vedi questo box, il link ti ha mandato qui invece che su /accept-invite.</p>
        </div>
      )}

      <div className="text-center text-sm space-y-2">
        <div className="text-muted-foreground">
          Non hai una scuola? <a href="https://wa.me/393517064080" target="_blank" rel="noopener noreferrer" className="text-orange hover:underline font-medium">Prova gratis 15 giorni &rarr;</a>
        </div>
        <div className="text-xs text-muted-foreground/60 pt-4">
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-orange" /></div>}>
      <LoginFormContent />
    </Suspense>
  );
}
