import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admisión | Amancio Varona",
  description: "Inicia el proceso de admisión y postula a tu menor hijo(a) en el Colegio Amancio Varona.",
};

export default function AdmisionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
