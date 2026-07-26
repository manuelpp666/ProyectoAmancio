import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendario | Amancio Varona",
  description: "Fechas importantes y eventos del año escolar del Colegio Amancio Varona.",
};

export default function CalendarioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
