"use client";
import { useUser } from "@/src/context/userContext";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AsideCampus as SidebarEstudiante } from "@/src/components/Campus/CampusEstudiante/AsideCampus";
import { AsideDocente as SidebarDocente} from "@/src/components/Campus/CampusDocente/AsideDocente";
import { AsidePanel as SidebarPanel } from "@/src/components/Campus/PanelControl/Aside";
import { HeaderCampus as Header } from "@/src/components/Campus/HeaderCampus";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  
  const { role } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  // Lógica para elegir el Sidebar
  const renderSidebar = () => {
    // 1. Determinar el rol basado en la URL primero (Prioridad)
    let currentRole = role;
    if (pathname.includes("/campus-estudiante")) currentRole = "estudiante";
    if (pathname.includes("/campus-docente")) currentRole = "docente";
    if (pathname.includes("/panel-control")) currentRole = "admin";

    // 2. Renderizar según el rol detectado o guardado
    if (currentRole === "estudiante") {
      return <SidebarEstudiante isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />;
    }
    if (currentRole === "docente") {
      return <SidebarDocente isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />;
    }
    if (currentRole === "admin") {
      return <SidebarPanel isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />;
    }

    // Si no hay rol (ej. recarga de página en perfil), puedes poner uno por defecto
    return <SidebarEstudiante isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />;
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