"use client";

import { useState } from "react";
import { AsideCampus as Sidebar } from "@/src/components/Campus/AsideCampus";
import { HeaderCampus as Header } from "@/src/components/Campus/HeaderCampus";



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
      </head>
      <body>
        <div className="flex h-screen bg-[#F2F4F7] font-sans text-slate-800 overflow-hidden">
          {/* Overlay para móvil */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
              <div className="flex-1 flex flex-col min-w-0 h-full">
                <Header onOpenMenu={() => setIsMobileMenuOpen(true)} />
                  <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
                    {children}
                  </main>
              </div>
        </div>
      </body>
    </html>
  );
}