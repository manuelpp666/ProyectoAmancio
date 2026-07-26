import Header from "@/src/components/Pagina-Web/Header";
import Footer from "@/src/components/Pagina-Web/Footer";
import ChatWidget from "@/src/components/utils/ChatbotWidget";

// Layout compartido de la web pública: monta Header, Footer y el chatbot una sola
// vez, de modo que persisten entre navegaciones (el historial del chat no se pierde)
// y todas las páginas quedan consistentes.
export default function WebLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-800">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
