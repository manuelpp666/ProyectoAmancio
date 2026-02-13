"use client";
import { useUser } from "@/src/context/userContext";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AsideCampus as SidebarEstudiante } from "@/src/components/Campus/CampusEstudiante/AsideCampus";
import { AsideDocente as SidebarDocente} from "@/src/components/Campus/CampusDocente/AsideDocente";
import { AsidePanel as SidebarPanel } from "@/src/components/Campus/PanelControl/Aside";
import { HeaderCampus as Header } from "@/src/components/Campus/HeaderCampus";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  
  const { role, loading } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // 2. Estado de carga: Mientras recupera de localStorage, evitamos saltos visuales
  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center">Cargando...</div>;
  }
  // Lógica para elegir el Sidebar
  const renderSidebar = () => {
    // 3. Normalizamos la detección del rol (debe coincidir con "ALUMNO", "DOCENTE", "ADMIN")
    let currentRole = role;
    
    // Prioridad por URL si no hay rol en contexto aún
    if (pathname.includes("/campus-estudiante")) currentRole = "ALUMNO";
    if (pathname.includes("/campus-docente")) currentRole = "DOCENTE";
    if (pathname.includes("/panel-control")) currentRole = "ADMIN";

    // 4. Comparación con los valores correctos definidos en tu Context
    switch (currentRole) {
      case "ALUMNO":
        return <SidebarEstudiante isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />;
      case "DOCENTE":
        return <SidebarDocente isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />;
      case "ADMIN":
        return <SidebarPanel isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />;
      default:
        // Sidebar por defecto en caso de que no se detecte nada
        return <SidebarEstudiante isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F2F4F7] font-sans text-slate-800 overflow-hidden">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {renderSidebar()}

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Header onOpenMenu={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}