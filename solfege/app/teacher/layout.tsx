"use client";

import Image from "next/image";
import { BottomNav } from "@/components/teacher/bottom-nav";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      {/* Header Mobile-first */}
      <header className="sticky top-0 z-40 w-full h-20 bg-white border-b border-[#E8E4E0] flex items-center justify-center px-4">
        <div className="relative h-12 w-48">
          <Image 
            src="/logo.png" 
            alt="Solfège Logo" 
            fill
            priority
            className="object-contain"
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 p-4 max-w-md mx-auto w-full">
        {children}
      </main>

      {/* Navigation Inferiore */}
      <BottomNav />
    </div>
  );
}
