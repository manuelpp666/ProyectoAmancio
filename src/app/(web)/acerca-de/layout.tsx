import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acerca de | Amancio Varona",
  description: "Historia, misión, visión y valores del Colegio Amancio Varona.",
};

export default function AcercaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
