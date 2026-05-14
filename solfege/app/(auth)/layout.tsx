"use client";

import React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const logoHeight = isLogin ? 120 : 80;

  return (
    <div className="flex min-h-screen w-full font-sans antialiased">
      {/* Lato Sinistro: Brand */}
      <div className="hidden w-1/2 flex-col justify-center bg-sidebar p-12 lg:flex">
        <div className="max-w-md space-y-4">
          <Image 
            src="/logo.png" 
            alt="Solfège Logo" 
            width={300} 
            height={logoHeight} 
            className="w-auto object-contain"
            style={{ height: `${logoHeight}px` }}
            priority
          />
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
