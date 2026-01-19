"use client";
import { Menu, Bell } from "lucide-react";
import Link from "next/link";

export function HeaderCampus({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20 shrink-0">
      <div className="flex items-center gap-3 lg:hidden">
        <button onClick={onOpenMenu} className="text-[#701C32] p-1"><Menu size={28} /></button>
        <span className="font-bold text-[#701C32] text-lg">Campus Virtual</span>
      </div>
      <div className="flex items-center gap-4 ml-auto">
        <Link href="inicio-campus/notificaciones" className="relative text-gray-400"><Bell size={22} /></Link>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-800">Gabriela Antonet</p>
          </div>
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Gabriela" className="w-10 h-10 rounded-full border" alt="Perfil" />
        </div>
      </div>
    </header>
  );
}