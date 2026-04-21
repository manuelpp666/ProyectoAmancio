"use client"; // Necesario para usar hooks como useState

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Noticias", href: "/noticias" },
    { name: "Acerca de", href: "/acerca-de" },
    { name: "Docentes", href: "/docentes" },
    { name: "Calendario", href: "/calendario" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3">
              <div className="relative w-12 h-12">
                <Image
                  src="/logo.png"
                  alt="Logo Amancio Varona"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-black text-xl tracking-tight text-[#701C32] uppercase">
                Amancio Varona
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="font-bold text-sm uppercase tracking-wider text-slate-700 hover:text-[#701C32] transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/campus"
              className="bg-[#093E7A] text-white px-6 py-2.5 rounded-full font-bold text-sm uppercase tracking-wider hover:bg-[#073365] transition-all shadow-lg shadow-[#093E7A]/20"
            >
              Campus Virtual
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-[#701C32] focus:outline-none"
              aria-label="Toggle menu"
            >
              <span className="material-icons-round text-3xl">
                {isOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[500px] border-b border-slate-100" : "max-h-0"
        } bg-white`}
      >
        <div className="px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block px-3 py-3 rounded-md text-base font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:text-[#701C32]"
            >
              {link.name}
            </Link>
          ))}
          <Link
            href="/campus"
            onClick={() => setIsOpen(false)}
            className="block w-full text-center bg-[#093E7A] text-white px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-wider mt-4"
          >
            Campus Virtual
          </Link>
        </div>
      </div>
    </nav>
  );
}