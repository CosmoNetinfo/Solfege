"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Lock, Loader2 } from "lucide-react";
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

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error("Credenziali non valide. Riprova.");
        return;
      }

      toast.success("Accesso effettuato!");
      // Il middleware gestirà il redirect al ruolo corretto
      window.location.href = "/";
    } catch (err) {
      toast.error("Si è verificato un errore inaspettato.");
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
                type="password"
                className="pl-10 border-border"
                {...register("password")}
              />
            </div>
            {errors.password && <p className="text-red text-xs">{errors.password.message}</p>}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-orange hover:bg-orange-dark text-white h-11"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Accedi"}
        </Button>

      </form>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Non hai una scuola? </span>
        <Link href="/register" className="text-orange hover:underline font-medium">
          Crea una nuova scuola &rarr;
        </Link>
      </div>
    </div>
  );
}
