import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "../context/userContext";
export const metadata: Metadata = {
  title: "Amancio Varona",
  description: "La mejor institución educativa de Tumán",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
      </head>
      <body>

        <UserProvider>{children}</UserProvider>
        
      </body>
    </html>
  );
}