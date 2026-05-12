import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full font-sans antialiased">
      {/* Lato Sinistro: Brand */}
      <div className="hidden w-1/2 flex-col justify-center bg-sidebar p-12 lg:flex">
        <div className="max-w-md space-y-4">
          <h1 className="font-serif text-6xl font-bold tracking-tight text-orange">
            Solfège
          </h1>
          <p className="text-xl text-sidebar-foreground leading-relaxed">
            Il gestionale per la tua scuola di musica.
          </p>
        </div>
      </div>

      {/* Lato Destro: Form */}
      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
