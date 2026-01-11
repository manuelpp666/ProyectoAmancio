"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import BotonPrimario from "../components/BotonFront";
import { Degradado } from "../components/LineaDegradada";

const VIRTUDES = [
  {
    titulo: "Científico",
    descripcion: "Fomentamos el pensamiento crítico y la investigación experimental en nuestros laboratorios.",
    color: "border-blue-500",
    bg: "bg-blue-50"
  },
  {
    titulo: "Humanístico",
    descripcion: "Desarrollamos la empatía, la ética y la comprensión profunda de nuestra sociedad.",
    color: "border-red-500",
    bg: "bg-red-50"
  },
  {
    titulo: "Artístico",
    descripcion: "Potenciamos la creatividad a través de la música, el teatro y las artes visuales.",
    color: "border-yellow-500",
    bg: "bg-yellow-50"
  },
  {
    titulo: "Deportivo",
    descripcion: "Promovemos la disciplina, el trabajo en equipo y la salud física constante.",
    color: "border-green-500",
    bg: "bg-green-50"
  }
];

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);

  // Lógica de Auto-play
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev === VIRTUDES.length - 1 ? 0 : prev + 1));
    }, 5000); // Cambia cada 5 segundos

    return () => clearInterval(interval); // Limpieza al desmontar
  }, [activeIndex]); // Se reinicia el contador si el usuario hace clic manualmente

  return (
    <main className="min-h-screen">
      {/* HERO SECTION */}
      <section className="relative h-[400px] flex flex-col items-center justify-center text-center border-b border-dashed">
        <h1 className="text-5xl font-black text-gray-800">Frase de colegio</h1>
        <p className="text-xl text-gray-600 mt-2">Sub frase de colegio</p>
        <BotonPrimario href="/matricula">
          Acceder a Matrícula
        </BotonPrimario>
        <div className="absolute inset-0 -z-10 flex items-center justify-center overflow-hidden opacity-10">
          <div className="absolute w-full h-[1px] bg-black rotate-12"></div>
          <div className="absolute w-full h-[1px] bg-black -rotate-12"></div>
        </div>
      </section>

      {/* PROPUESTA EDUCATIVA (CARRUSEL AUTOMÁTICO) */}
      <section className="py-16 px-10 text-center">
        <h2 className="text-3xl font-bold mb-8 italic">Propuesta Educativa</h2>
        
        <div className="max-w-4xl mx-auto border-2 border-gray-200 p-10 relative overflow-hidden bg-white shadow-sm">
          {/* Contenido con transición suave de opacidad */}
          <div 
            key={activeIndex} 
            className="animate-in fade-in duration-700 slide-in-from-bottom-2"
          >
            <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 text-gray-800">
              {VIRTUDES[activeIndex].titulo}
            </h3>
            
            <div className={`h-48 flex flex-col items-center justify-center my-4 border-2 border-dashed ${VIRTUDES[activeIndex].color} ${VIRTUDES[activeIndex].bg} transition-colors duration-500 p-8`}>
               <p className="text-gray-700 text-lg leading-relaxed max-w-xl">
                {VIRTUDES[activeIndex].descripcion}
               </p>
            </div>
          </div>

          {/* Indicadores (Dots) */}
          <div className="flex justify-center gap-3 mt-6">
            {VIRTUDES.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`h-2 transition-all duration-300 rounded-full ${
                  activeIndex === index ? "w-8 bg-gray-800" : "w-2 bg-gray-300"
                }`}
                aria-label={`Ver ${VIRTUDES[index].titulo}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* METODOLOGÍA POR NIVELES*/}
      <section className="py-16 bg-gray-50 text-center">
        <h2 className="text-2xl font-bold mb-10 tracking-tight">Conoce nuestra metodología por niveles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-10 max-w-6xl mx-auto">
          {["Nivel Primaria", "Nivel secundario", "Academia Pre"].map((nivel) => (
            <div key={nivel} className="group cursor-pointer">
              <div className="w-full aspect-square border-2 border-gray-300 mb-4 relative flex items-center justify-center group-hover:border-blue-500 transition-colors">
                 <div className="absolute inset-0 opacity-10 flex items-center justify-center group-hover:opacity-30">
                    <div className="w-full h-[1px] bg-black rotate-45 absolute"></div>
                    <div className="w-full h-[1px] bg-black -rotate-45 absolute"></div>
                 </div>
                 <span className="text-gray-400 group-hover:text-blue-500 font-bold uppercase text-xs tracking-widest">Imagen {nivel}</span>
              </div>
              <p className="font-bold text-gray-800">{nivel}</p>
            </div>
          ))}
        </div>
      </section>
      <Degradado />
      {/* NOTICIAS AMANCISTAS */}
      <section className="py-16 ">
        <h2 className="text-center text-2xl font-black mb-10 uppercase italic">Noticias Amancistas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-10 max-w-6xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-video border-2 border-gray-300 relative bg-gray-100 overflow-hidden">
               <div className="absolute inset-0 opacity-10 flex items-center justify-center">
                  <div className="w-full h-[1px] bg-black rotate-12 absolute"></div>
                  <div className="w-full h-[1px] bg-black -rotate-12 absolute"></div>
               </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-10">
          <BotonPrimario href="/noticias">
            Más noticias
          </BotonPrimario>
          
        </div>
      </section>
    </main>
  );
}