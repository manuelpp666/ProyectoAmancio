import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Noticias | Amancio Varona",
  description: "Comunicados, logros y actividades de la comunidad Amancista.",
};

export default function NoticiasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
